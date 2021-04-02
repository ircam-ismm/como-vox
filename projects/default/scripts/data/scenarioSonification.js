function scenarioSonification(graph, helpers, outputFrame) {
  const app = (typeof global !== 'undefined' ? global.app : window.app);

  const conversion = app.imports.helpers.conversion;
  const notesToSeconds = conversion.notesToSeconds;

  const noteChannel = 'scenario';

  let readyRequest = false;
  const readyNotePitch = 99; // E7
  const readyNoteIntensity = 80;
  const readyNoteDuration = 1; // in beats

  let cancelRequest = false;
  const cancelNotePitch = 82; // E6
  const cancelNoteIntensity = 80;
  const cancelNoteDuration = 1 / 4; // in whole notes
  const cancelNoteRepetition = 3;
  const cancelNoteRepetitionInterval = 1 / 32; // in whole notes

  let scenarioStatusLast = 'off';

  const parameters = {
    scenarioCurrent: null,
    scenarioStatus: null,
  };

  const updateParams = (updates) => {
    for(const p of Object.keys(updates) ) {
      switch(updates.scenarioStatus) {
        case 'ready': {
          readyRequest = true;
          break;
        }

        case 'cancel': {
          cancelRequest = true;
          break;
        }

        default: {
          break;
        }
      }

      if(parameters.hasOwnProperty(p) ) {
        parameters[p] = updates[p];
      }
    }
  }

  ///// Events and data (defined only in browser)
  const registeredEvents = [];
  if(app.events && app.state) {
    [
      'scenarioCurrent',
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

      const time = inputData['time'];
      const tempo = inputData['tempo'];
      const timeSignature = inputData['timeSignature'];

      // channel shared by multiple scenarios
      // managed by scenarioManager
      const notesContainer = inputData['notes'] || {
        [noteChannel]: [],
      };
      const notes = notesContainer[noteChannel];

      if(readyRequest) {
        readyRequest = false;
        const note = {
          channel: noteChannel,
          time: time.audio,
          pitch: readyNotePitch,
          intensity: readyNoteIntensity,
          duration: readyNoteDuration,
        };
        notes.push(note);
      }

      if(cancelRequest) {
        cancelRequest = false;
        for(let n = 0; n < cancelNoteRepetition; ++n) {
          const note = {
            channel: noteChannel,
            time: time.audio + n * notesToSeconds(cancelNoteRepetitionInterval,
                                                  {tempo, timeSignature}),
            pitch: cancelNotePitch,
            intensity: cancelNoteIntensity,
            duration: cancelNoteDuration,
          };
          notes.push(note);
        }
      }

      outputData['notes'] = notesContainer;
      return outputFrame;
    },

    destroy() {
      registeredEvents.forEach( ([event, callback]) => {
        app.events.removeListener(event, callback);
      });
    },

  };
}