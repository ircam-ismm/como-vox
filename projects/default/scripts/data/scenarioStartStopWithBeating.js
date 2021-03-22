function scenarioStartStopWithBeating(graph, helpers, outputFrame) {
  const app = (typeof global !== 'undefined' ? global.app : window.app);

  let status = 'off'
  let startTime = 0;

  const noteChannel = 'scenario';

  const initNotePitch = 99; // E7
  const initNoteIntensity = 80;
  const initNoteDuration = 1; // in beats

  const parameters = {
    waitDuration: 1, // in seconds, before stillness
    stillnessDurationMin: 0.5, // in seconds
  };

  const updateParams = (updates) => {
    if(typeof updates.scenarioStartStopWithBeating !== 'undefined') {
      const active = updates.scenarioStartStopWithBeating;
      const activeChanged = active != parameters.scenarioStartStopWithBeating;
      parameters.scenarioStartStopWithBeating = active;
      if(active) {
        // may retrigger, even if already active
        startTime = app.data['time'].local;
        status = 'init';
        app.events.emit('scenarioStatus', status);
        app.events.emit('gestureControlsPlaybackStart', false);
        app.events.emit('gestureControlsPlaybackStop', true);
        app.events.emit('playback', false);
        app.events.emit('tempoReset', true);
        app.events.emit('seekPosition',  {bar: 1, beat: 1});
      } else {
        status = 'off';
        // do not trigger anything on deactivation
      }
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
      'gestureControlsPlaybackStart',
      'playback',
      'scenarioStartStopWithBeating',
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

      // channel shared by multiple scenarios
      // managed by scenarioManager
      const notesContainer = inputData['notes'] || {
        [noteChannel]: [],
      };
      const notes = notesContainer[noteChannel];
      outputData['notes'] = notesContainer;

      const stillness = inputData['stillness'];

      if(!parameters.scenarioStartStopWithBeating
        || !stillness) {
        return outputFrame;
      }

      const time = inputData['time'];

      switch(status) {
        case 'init': {
          status = 'waiting';
          app.events.emit('scenarioStatus', status);
          break;
        }

        case 'waiting': {
          if(time.local - startTime >= parameters.waitDuration) {
            status = 'stillness';
            app.events.emit('scenarioStatus', status);
            startTime = time.local;
          }
          break;
        }

        case 'stillness': {
          if(!stillness.status) {
            startTime = time.local;
          } else {
            if(time.local - startTime >= parameters.stillnessDurationMin) {
              status = 'running';
              app.events.emit('scenarioStatus', status);
              app.events.emit('gestureControlsPlaybackStart', true);

              const note = {
                channel: noteChannel,
                time: time.audio,
                pitch: initNotePitch,
                intensity: initNoteIntensity,
                duration: initNoteDuration,
              };
              notes.push(note);
            }

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