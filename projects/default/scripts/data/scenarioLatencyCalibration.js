function scenarioLatencyCalibration(graph, helpers, outputFrame) {
  const app = (typeof global !== 'undefined' ? global.app : window.app);

  const conversion = app.imports.helpers.conversion;
  const positionDeltaToSeconds = conversion.positionDeltaToSeconds;

  // to restore after calibration
  const parametersBackup = {};
  const parametersScenario = {
    gestureControlsBeatOffset: false,
    gestureControlsIntensity: false,
    gestureControlsPlaybackStart: false,
    gestureControlsPlaybackStop: false,
    gestureControlsTempo: false,
    measures: true,
    metronomeSound: true,
    playbackStopSeek: 'start',
    scoreFileName: null,
    tempo: 60,
    timeSignature: {count: 4, division: 4},
  };

  const parameters = {
    ...parametersScenario,
    audioLatency: 0,
    // @TODO: use playbackStartAfterCount
    beatGestureWaitingDurationMax: 2, // in seconds, for time-out
    beatingDuration: {bar: 4, beat: 0},
    beatingStandardDeviationMax: 0.25, // in seconds
    initialWaitingDuration: 1, // in seconds, before stillness
    listeningDuration: {bar: 1, beat: 0}, // before beating
    playback: 0,
    playbackLatency: 0,
    scenarioStatus: 'off',
    stillnessWaitingDurationMax: 2, // in seconds, for time-out
    stillnessWaitingDurationMin: 0.5, // in seconds, before ready to start
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
      || status === 'tooMuchJitter'
      || status === 'error'
  };

  const updateParams = (updates) => {
    if(typeof updates.scenarioLatencyCalibration !== 'undefined') {
      const activeChanged = updates.scenarioLatencyCalibration
            !== parameters.scenarioLatencyCalibration;
      const active = updates.scenarioLatencyCalibration;
      parameters.scenarioLatencyCalibration = active;
      if(active) {
        if(activeChanged) {
          parametersSave();
        }
        statusUpdate('init');
        parametersApply();
        app.events.emit('seekPosition', {bar: 1, beat: 1});
        app.events.emit('playback', false);
      } else {
        if(activeChanged) {
          parametersRestore();
        }
      }
    }

    if(parameters.scenarioLatencyCalibration
       && parameters.playback === true
       && updates.playback === false
       && status !== 'done') {
      statusUpdate('cancel');
    }

    if(parameters.scenarioLatencyCalibration
       && statusIsError(updates.scenarioStatus) ) {
      parametersRestore();
      app.events.emit('scenarioLatencyCalibration', false);
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
              'beatGestureWaitingDurationMax',
              'playback',
              'playbackLatency',
              'scenarioLatencyCalibration',
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
        playbackLatency,
        positon,
        tempo,
        time,
        timeSignature,
        stillness
      } = inputData;

      if(!parameters.scenarioLatencyCalibration
        || !stillness) {
        return outputFrame;
      }

      switch(status) {
        case 'init': {
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
            app.events.emit('seekPosition', {bar: 1, beat: 1});
            app.events.emit('playback', true);
            statusUpdate('listening');
          }
          break;
        }

        case 'listening': {
          if(beatGesture && beatGesture.trigger) {
            beatGestureTriggered = true;
            statusUpdate('cancel');
          }

          const listeningDuration = positionDeltaToSeconds(parameters.listeningDuration, {
               timeSignature,
               tempo,
          });

          if(!beatGestureTriggered
             && time.local - statusTime >= listeningDuration) {
            app.events.emit('measuresClear', true);
            statusUpdate('ready');
          }
          break;
        }

        case 'ready': {
          const beatGesture = inputData['beat'];
          if(beatGesture && beatGesture.trigger) {
            beatGestureTriggered = true;
            statusUpdate('playing');
          }

          // wait until hearing playback: add playbackLatency
          if(!beatGestureTriggered
             && (time.local - statusTime - playbackLatency
                 >= parameters.beatGestureWaitingDurationMax) ) {
            // no start, cancel
            statusUpdate('cancel');
          }
          break;
        }

        case 'playing': {
          const beatingDuration = positionDeltaToSeconds(parameters.beatingDuration, {
            timeSignature,
            tempo,
          });

          if(time.local - statusTime >= beatingDuration) {
            statusUpdate('done');
            app.events.emit('playback', false);
          }
          break;
        }

        case 'done': {
          const {
            mean,
            median,
            standardDeviation,
          } = app.measures.beatOffsetsSecondsStatistics;

          if(typeof mean === 'undefined') {
            statusUpdate('error');
          } else if(standardDeviation >= parameters.beatingStandardDeviationMax) {
            statusUpdate('tooMuchJitter');
          } else {
            const audioLatency = Math.max(0, parameters.audioLatency - median);
            app.events.emit('audioLatency', audioLatency);
            app.events.emit('scenarioLatencyCalibration', false);
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