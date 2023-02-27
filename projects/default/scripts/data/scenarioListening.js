function scenarioListening(graph, helpers, outputFrame) {
  const app = (typeof global !== 'undefined' ? global.app : window.app);

  const conversion = app.imports.helpers.conversion;
  const {
    positionAddBeats,
    positionChangeBeatingUnit,
    positionsToBeatsDelta,
    timeSignatureChangeBeatingUnit,
  } = conversion;

  // to restore after calibration
  const parametersBackup = {};
  const parametersScenario = {
    gestureControlsBeatOffset: false,
    gestureControlsIntensity: false,
    gestureControlsPlaybackStart: false,
    gestureControlsPlaybackStop: false,
    gestureControlsTempo: false,
    metronomeSound: true,
  };

  const parameters = {
    ...parametersScenario,
    playback: false,
    playbackStartAfterCount: {bar: 1, beat: 0},
    scenarioStatus: 'off',
    timeSignature: {bar: 4, beat: 4},
  };

  const parametersApply = () => {
    for(const [key, value] of Object.entries(parametersScenario) ) {
      app.events.emit(key, value);
    }
  };

  const parametersSave = () => {
    for(const p of Object.keys(parametersScenario) ) {
      parametersBackup[p] = parameters[p];
    }
  };

  const parametersRestore = () => {
    for(const p of Object.keys(parametersBackup) ) {
      app.events.emit(p, parametersBackup[p]);
    }
  };

  let status = 'off'
  let statusTime = 0;
  let timeoutTime = 0;
  let beatGestureTriggered = false;
  const statusUpdate = (statusRequest) => {
    const statusChanged = status !== statusRequest;
    status = statusRequest;
    statusTime = app.data['time'].local;
    if(statusChanged) {
      app.events.emit('scenarioStatus', status);
    }
  };

  const statusIsError = (status) => {
    return status === 'cancel'
      || status === 'error'
  };

  const updateParams = (updates) => {
    if(typeof updates.scenarioListening !== 'undefined') {
      const activeChanged = updates.scenarioListening
            !== parameters.scenarioListening;
      const active = updates.scenarioListening;
      parameters.scenarioListening = active;
      if(active) {
        if(activeChanged) {
          parametersSave();
        }
        statusUpdate('init');
        parametersApply();
      } else {
        if(activeChanged) {
          app.events.emit('playback', false);
          parametersRestore();
        }
      }
    }

    // update saved metronomeSound while playing
    if(parameters.scenarioListening
       && status !== 'precount'
       && status !== 'init'
       && typeof updates.metronomeSound !== 'undefined') {
      // update to changes since scenario is active
      parametersBackup.metronomeSound = updates.metronomeSound;
    }

    // stop
    if(parameters.scenarioListening
       && parameters.playback === true
       && updates.playback === false
       && status !== 'done') {
      statusUpdate('done');
    }

    if(parameters.scenarioListening
       && statusIsError(updates.scenarioStatus) ) {
      parametersRestore();
      app.events.emit('scenarioListening', false);
    }

    for(const p of Object.keys(updates) ) {
      if(parameters.hasOwnProperty(p) ) {
        parameters[p] = updates[p];
      }
    }
  };

  ///// Events and data (defined only in browser)
  const registeredEvents = [];
  if(app.events && app.state) {
    const eventsToRegister =
          // Use set for uniqueness
          [...new Set([
            // register parameters to save and restore
            ...Object.keys(parametersScenario),
            // declare own parameters
            ...[
              'audioLatency',
              'playback',
              'playbackStartAfterCount',
              'scenarioListening',
              'scenarioStatus',
            ],
          ])];

    eventsToRegister.forEach( (event) => {
      const callback = (value) => {
        // compatibility with setGraphOption
        updateParams({[event]: value});
      };
      registeredEvents.push([event, callback]);
      app.events.on(event, callback);
      // apply current state
      updateParams({[event]: app.state[event]});
    });
  }


  return {
    updateParams,

    process(inputFrame, outputFrame) {
      const inputData = app.data;
      const outputData = app.data;

      const {
        beat: beatGesture,
        playback,
        position,
        tempo,
        time,
        timeSignature,
        stillness
      } = inputData;

      const beatingUnit = app.state.beatingUnit;
      const timeSignatureBeating
            = timeSignatureChangeBeatingUnit(timeSignature, {
              beatingUnitNew: beatingUnit,
            });

      if(!parameters.scenarioListening) {
        return outputFrame;
      }

      switch(status) {
        case 'init': {

          // wait for 4 beats on 1/4 and 2/4 time signature
          const barCount = (timeSignatureBeating.count >= 3
                            ? timeSignatureBeating.count
                            : 4);

          const startAfterBeats
                = parameters.playbackStartAfterCount.bar * barCount
                + parameters.playbackStartAfterCount.beat

          const seekPositionBeating
                = positionAddBeats({bar: 1, beat: 1},
                                   -startAfterBeats,
                                   {
                                     timeSignature: timeSignatureBeating,
                                   });

          const seekPosition = positionChangeBeatingUnit(seekPositionBeating, {
            timeSignature,
            beatingUnit,
            // new beatingUnitNew to revert to timeSignature.division
          });

          app.events.emit('tempoReset', true);

          // @TODO: bug on seek with quick events
          app.events.emit('seekPosition', seekPosition);
          app.events.emit('metronomeSound', true);
          app.events.emit('playback', true);
          app.events.emit('seekPosition', seekPosition);
          statusUpdate('precount');
          break;
        }

        case 'precount': {
          const precountEndPosition = positionAddBeats({bar: 1, beat: 1},
                                                       -1,
                                                       {timeSignature});
          if(positionsToBeatsDelta(position, precountEndPosition,
                                   {timeSignature}) > 0) {
            app.events.emit('metronomeSound',
                            parametersBackup['metronomeSound']);
            statusUpdate('playing');
          }

          break;
        }

        default:
          break;
      }

      return outputFrame;
    },

    destroy() {
      registeredEvents.forEach( ([event, callback]) => {
        app.events.removeListener(event, callback);
      });
    },

  };
}