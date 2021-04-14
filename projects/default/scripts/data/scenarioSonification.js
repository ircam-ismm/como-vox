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

  let errorRequest = false;
  const errorNotePitch = 81; // Eb6
  const errorNoteIntensity = 80;
  const errorNoteDuration = 1 / 4; // in whole notes
  const errorNoteRepetition = 4;
  const errorNoteRepetitionInterval = 1 / 16; // in whole notes

  let tooSlowRequest = false;
  const tooSlowNotePitch = 77; // C6
  const tooSlowNoteIntensity = 80;
  const tooSlowNoteDuration = 1; // in whole notes
  const tooSlowNoteRepetition = 2;
  const tooSlowNoteRepetitionInterval = 1 / 4; // in whole notes

  let tooFastRequest = false;
  const tooFastNotePitch = 85; // G6
  const tooFastNoteIntensity = 80;
  const tooFastNoteDuration = 1 / 8; // in whole notes
  const tooFastNoteRepetition = 8;
  const tooFastNoteRepetitionInterval = 1 / 64; // in whole notes

  let tooMuchJitterRequest = false;
  const tooMuchJitterNotes = [
    {pitch: 82, intensity: 80, duration: 1/8, delay: 0},
    {pitch: 77, intensity: 80, duration: 1,   delay: 1/16},
    {pitch: 82, intensity: 80, duration: 1/3, delay: 1/5},
    {pitch: 77, intensity: 80, duration: 1/4, delay: 1/7},
  ];

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

        case 'error': {
          errorRequest = true;
          break;
        }

        case 'tooSlow': {
          tooSlowRequest = true;
          break;
        }

        case 'tooFast': {
          tooFastRequest = true;
          break;
        }

        case 'tooMuchJitter': {
          tooMuchJitterRequest = true;
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

      if(errorRequest) {
        errorRequest = false;
        for(let n = 0; n < errorNoteRepetition; ++n) {
          const note = {
            channel: noteChannel,
            time: time.audio + n * notesToSeconds(errorNoteRepetitionInterval,
                                                  {tempo, timeSignature}),
            pitch: errorNotePitch,
            intensity: errorNoteIntensity,
            duration: errorNoteDuration,
          };
          notes.push(note);
        }
      }

      if(tooSlowRequest) {
        tooSlowRequest = false;
        for(let n = 0; n < tooSlowNoteRepetition; ++n) {
          const note = {
            channel: noteChannel,
            time: time.audio + n * notesToSeconds(tooSlowNoteRepetitionInterval,
                                                  {tempo, timeSignature}),
            pitch: tooSlowNotePitch,
            intensity: tooSlowNoteIntensity,
            duration: tooSlowNoteDuration,
          };
          notes.push(note);
        }
      }

      if(tooFastRequest) {
        tooFastRequest = false;
        for(let n = 0; n < tooFastNoteRepetition; ++n) {
          const note = {
            channel: noteChannel,
            time: time.audio + n * notesToSeconds(tooFastNoteRepetitionInterval,
                                                  {tempo, timeSignature}),
            pitch: tooFastNotePitch,
            intensity: tooFastNoteIntensity,
            duration: tooFastNoteDuration,
          };
          notes.push(note);
        }
      }

      if(tooMuchJitterRequest) {
        tooMuchJitterRequest = false;
        let timeCurrent = time.audio;
        tooMuchJitterNotes.forEach( (note) => {
          timeCurrent += notesToSeconds(note.delay, {tempo, timeSignature});
          const {pitch, intensity, duration} = note;
          notes.push({
            channel: noteChannel,
            time: timeCurrent,
            pitch,
            intensity,
            duration,
          });
        });
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