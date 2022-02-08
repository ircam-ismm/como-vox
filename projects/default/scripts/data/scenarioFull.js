function scenarioFull(graph, helpers, outputFrame) {
  const app = (typeof global !== 'undefined' ? global.app : window.app);

  const conversion = app.imports.helpers.conversion;
  const beatsToSeconds = conversion.beatsToSeconds;
  const notesToBeats = conversion.notesToBeats;

  // to restore after calibration
  const parametersBackup = {};
  // initial values
  const playbackStopSeek = (app.state
                            && typeof app.state.playbackStopSeek !== 'undefined'
                            ? app.state.playbackStopSeek
                            : 'barStart');

  const parametersScenario = {
    gestureControlsBeatOffset: true,
    gestureControlsIntensity: true,
    gestureControlsPlaybackStart: false,
    gestureControlsPlaybackStop: true,
    gestureControlsTempo: true,
    playbackStopSeek,
  };

  const parameters = {
    ...parametersScenario,
    scenarioStatus: 'off',
    initialWaitingDuration: 1, // in seconds, before stillness
    stillnessWaitingDurationMin: 0.5, // in seconds, before ready to start
    stillnessWaitingDurationMax: 2, // in seconds, for time-out
    beatGestureWaitingDurationMax: 2, // in seconds, for time-out
    playback: false,
    playbackStartAfterCount: {
      bar: 1,
      beat: 0, // one more for upbeat before start
    },
    scenarioPlayback: false,
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
      || status === 'tooFast'
      || status === 'tooSlow'
      || status === 'tooMuchJitter'
      || status === 'error'
  };

  const updateParams = (updates) => {
    // propagate error from beating
    if(parameters.scenarioFull
       && !statusIsError(status)
       && statusIsError(updates.gestureControlsPlaybackStartStatus) ) {
      statusUpdate(updates.gestureControlsPlaybackStartStatus);
    }

    if(parameters.scenarioFull
       && statusIsError(updates.scenarioStatus) ) {
      app.events.emit('scenarioPlayback', false);
    }

    if(typeof updates.scenarioFull !== 'undefined') {
      const activeChanged = updates.scenarioFull
            !== parameters.scenarioFull;
      const active = updates.scenarioFull;
      parameters.scenarioFull = active;
      if(active) {
        if(activeChanged) {
          parametersSave();
        }
      } else {
        if(activeChanged) {
          app.events.emit('scenarioPlayback', false);
          app.events.emit('playback', false);
          parametersRestore();
        }
      }
    }

    // start
    if(parameters.scenarioFull
       && parameters.scenarioPlayback === false
       && updates.scenarioPlayback === true
       && status !== 'init') {
      // may retrigger, even if already active
      statusUpdate('init');

      // update to changes
      parametersScenario.playbackStopSeek = app.state.playbackStopSeek;

      parametersApply();

      // over-rides
      app.events.emit('gestureControlsPlaybackStart', false);
      app.events.emit('gestureControlsPlaybackStop', true);
      // must start at the beginning of a bar (from start is fine, too)
      if(app.state.playbackStopSeek !== 'start'
         && app.state.playbackStopSeek !== 'barStart') {
        app.events.emit('playbackStopSeek', 'barStart');
      }
      app.events.emit('playback', false);
      app.events.emit('tempoReset', true);
    }

    // stop
    if(parameters.scenarioFull
       && (parameters.playback === true && updates.playback === false
           || parameters.scenarioPlayback === true && updates.scenarioPlayback === false)
       && status !== 'off') {
      statusUpdate('off');
      app.events.emit('gestureControlsPlaybackStart', false);
      app.events.emit('gestureControlsPlaybackStop', false);
      app.events.emit('scenarioPlayback', false);
      app.events.emit('playback', false);
    }

    if(parameters.scenarioFull
       && typeof updates.gestureControlsPlaybackStart !== 'undefined'
       && !updates.gestureControlsPlaybackStart
       && status === 'ready') {
      statusUpdate('cancel');
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
              'beatGestureWaitingDurationMax',
              'gestureControlsPlaybackStartStatus',
              'playback',
              'playbackStopSeek',
              'playbackStartAfterCount',
              'scenarioFull',
              'scenarioPlayback',
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
        lookAheadNotes,
        playback,
        playbackLatency,
        stillness,
        tempo,
        time,
        timeSignature,
      } = inputData;

      if(!parameters.scenarioFull
        || !stillness) {
        return outputFrame;
      }

      switch(status) {
        case 'init': {
          app.events.emit('tempoReset', true);

          statusUpdate('waiting');
          break;
        }

        case 'waiting': {
          if(time.local - statusTime >= parameters.initialWaitingDuration) {
            timeoutTime = time.local;
            statusUpdate('waitingForStillness');
          }
          break;
        }

        case 'waitingForStillness': {
          if(time.local - timeoutTime >= parameters.stillnessWaitingDurationMax) {
            statusUpdate('cancel');
          } else if(!stillness.status) {
            // not still, restart
            statusUpdate('waitingForStillness');
          } else if(time.local - statusTime >= parameters.stillnessWaitingDurationMin) {
            timeoutTime = time.local;
            beatGestureTriggered = false;
            statusUpdate('ready');
            app.events.emit('gestureControlsPlaybackStart', true);
          }

          break;
        }

        case 'ready': {
          const beatGesture = inputData['beat'];
          if(beatGesture && beatGesture.trigger) {
            beatGestureTriggered = true;
          }

          // wait for 4 beats on 1/4 and 2/4 time signature
          const barCount = (timeSignature.count >= 3
                            ? timeSignature.count
                            : 4);

          // keep some beats for look-ahead
          const lookAheadBeats =
                notesToBeats(lookAheadNotes, {timeSignature});

          // warning: this is a float
          const stopAfterBeatsWithLookAhead
                = parameters.playbackStartAfterCount.bar * barCount
                + parameters.playbackStartAfterCount.beat
                + 1
                - lookAheadBeats;

          const stopAfterDuration = beatsToSeconds(stopAfterBeatsWithLookAhead, {
            tempo,
            timeSignature,
          });

          // wait until hearing playback: add playbackLatency
          if(!beatGestureTriggered
             && (time.local - timeoutTime - playbackLatency
                 >= parameters.beatGestureWaitingDurationMax + stopAfterDuration) ) {
            // no start, cancel
            statusUpdate('cancel');
          } else if(playback) {
            statusUpdate('playing');
          }
          break;
        }

        default: {
          break;
        }
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