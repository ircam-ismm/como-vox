function startFromStillness(graph, helpers, outputFrame) {
  const app = (typeof global !== 'undefined' ? global.app : window.app);

  let status = 'off'
  let startTime = 0;

  const waitSoundPitch = 94; // Bb6
  const initSoundPitch = 99; // E7
  const initSoundChannel = 'ding';
  const initSoundIntensity = 80;
  const initSoundDuration = 1; // in beats

  const parameters = {
    waitDuration: 1, // in seconds, before stillness
    stillnessDurationMin: 0.5, // in seconds
  };

  const updateParams = (updates) => {
    if(typeof updates.gestureControlsPlaybackStartInit !== 'undefined') {
      const init = updates.gestureControlsPlaybackStartInit;
      parameters.gestureControlsPlaybackStartInit = init;
      if(init) {
        startTime = app.data['time'].local;
        status = 'init'
        app.events.emit('gestureControlsPlaybackStart', false);
        app.events.emit('playback', false);
        app.events.emit('tempoReset', true);
      }
    }

    if(typeof updates.gestureControlsPlaybackStart !== 'undefined') {
      app.events.emit('gestureControlsPlaybackStartInit', false);
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
      'gestureControlsPlaybackStartInit',
      'playback',
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
      notesContainer[initSoundChannel] = notes;
      outputData['notes'] = notesContainer;

      const stillness = inputData['stillness'];

      if(!parameters.gestureControlsPlaybackStartInit
        || !stillness) {
        return outputFrame;
      }

      const time = inputData['time'];

      switch(status) {
        case 'init': {
          status = 'waiting';
          notes.push({
            time: time.audio,
            pitch: waitSoundPitch,
            intensity: initSoundIntensity,
            duration: initSoundDuration,
          });

          break;
        }

        case 'waiting': {
          if(time.local - startTime >= parameters.waitDuration) {
            status = 'stillness';
            startTime = time.local;
          }
          break;
        }

        case 'stillness': {
          if(!stillness.status) {
            startTime = time.local;
          } else {
            if(time.local - startTime >= parameters.stillnessDurationMin) {
              status = 'off';
              app.events.emit('gestureControlsPlaybackStartInit', false);
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