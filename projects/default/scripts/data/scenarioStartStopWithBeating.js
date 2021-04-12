function scenarioStartStopWithBeating(graph, helpers, outputFrame) {
  const app = (typeof global !== 'undefined' ? global.app : window.app);

  const conversion = app.imports.helpers.conversion;

  const parameters = {
    scenarioStatus: 'off',
    initialWaitingDuration: 1, // in seconds, before stillness
    stillnessWaitingDurationMin: 0.5, // in seconds, before ready to start
    stillnessWaitingDurationMax: 2, // in seconds, for time-out
    beatGestureWaitingDurationMax: 2, // in seconds, for time-out
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

  const updateParams = (updates) => {
    if(parameters.scenarioStartStopWithBeating
       && updates.scenarioStatus === 'cancel') {
      app.events.emit('gestureControlsPlaybackStart', false);
      app.events.emit('gestureControlsPlaybackStop', false);
      app.events.emit('scenarioStartStopWithBeating', false);
    }

    if(typeof updates.scenarioStartStopWithBeating !== 'undefined') {
      const active = updates.scenarioStartStopWithBeating;
      parameters.scenarioStartStopWithBeating = active;
      if(active) {
        // may retrigger, even if already active
        statusTime = app.data['time'].local;
        statusUpdate('init');
        app.events.emit('gestureControlsPlaybackStart', false);
        app.events.emit('gestureControlsPlaybackStop', true);
        app.events.emit('playback', false);
        app.events.emit('tempoReset', true);
      } else {
        // do not trigger anything on deactivation
      }
    }

    if(typeof updates.gestureControlsPlaybackStart !== 'undefined'
       && !updates.gestureControlsPlaybackStart
       && parameters.scenarioStatus === 'ready') {
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
    [
      'beatGestureWaitingDurationMax',
      'gestureControlsPlaybackStart',
      'scenarioStartStopWithBeating',
      'scenarioStatus',
    ].forEach( (event) => {
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

      const stillness = inputData['stillness'];

      if(!parameters.scenarioStartStopWithBeating
        || !stillness) {
        return outputFrame;
      }

      const time = inputData['time'];
      const playback = inputData['playback'];

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
          if(!beatGestureTriggered
             && time.local - timeoutTime >= parameters.beatGestureWaitingDurationMax) {
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