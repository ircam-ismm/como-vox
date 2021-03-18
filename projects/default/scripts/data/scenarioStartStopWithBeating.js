function scenarioStartStopWithBeating(graph, helpers, outputFrame) {
  const app = (typeof global !== 'undefined' ? global.app : window.app);

  let status = 'off'
  let startTime = 0;

  const soundChannel = 'scenario';

  const initSoundPitch = 99; // E7
  const initSoundIntensity = 80;
  const initSoundDuration = 1; // in beats

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
        // trigger only on deactivation
        if(activeChanged) {
          app.events.emit('scenarioStatus', status);
          app.events.emit('gestureControlsPlaybackStart', false);
          app.events.emit('gestureControlsPlaybackStop', false);
        }
      }
    }

    for(const p of Object.keys(updates) ) {
      if(parameters.hasOwnProperty(p) ) {
        parameters[p] = updates[p];
      }
    }
  };

  ///// Events and data (defined only in browser)
  if(app.events && app.state) {
    [
      'gestureControlsPlaybackStart',
      'playback',
      'scenarioStartStopWithBeating',
    ].forEach( (event) => {
      app.events.on(event, (value) => {
        // compatibility with setGraphOption
        updateParams({[event]: value});
      });
      updateParams({[event]: app.state[event]});
    });
  }


  return {
    updateParams,

    process(inputFrame, outputFrame) {
      const inputData = app.data;
      const outputData = app.data;

      const notes = [];
      // reset own channel
      const notesContainer = inputData['notes'] || {};
      notesContainer[soundChannel] = notes;
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

              notes.push({
                time: time.audio,
                pitch: initSoundPitch,
                intensity: initSoundIntensity,
                duration: initSoundDuration,
              });
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
    },

  };
}