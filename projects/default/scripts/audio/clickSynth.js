function clickSynth(graph, helpers, audioInNode, audioOutNode, outputFrame) {
  const app = (typeof global !== 'undefined' ? global.app : window.app);

  const conversion = app.imports.helpers.conversion;

  const dBToAmplitude = conversion.dBToAmplitude;
  const midiPichToHertz = conversion.midiPitchToHertz;
  const midiIntensityToAmplitude = conversion.midiIntensityToAmplitude;
  const positionsToSecondsDelta = conversion.positionsToSecondsDelta;
  const performanceToAudioContextTime = conversion.performanceToAudioContextTime;
  const beatsToSeconds = conversion.beatsToSeconds;

  const time = app.imports.helpers.time;
  const getTime = time.getTime;

  const audioContext = graph.como.audioContext;

  const parameters = {
    lookAheadSeconds: 0,
    intensityRange: 30, // in dB
  };

  let noteTimeLast = 0;

  return {
    updateParams(updates) {
      Object.assign(parameters, updates);
    },

    // called on each sensor frame
    process(inputFrame, outputFrame) {
      const inputData = inputFrame.data;

      const currentPosition = inputData['position'];
      // use logical time tag from frame
      const now = inputData['time'];

      const timeSignature = inputData['timeSignature'];
      const tempo = inputData['tempo'];

      const notesContainer = inputData['notes'];
      if(!notesContainer) {
        return;
      }

      // if(notesContainer['score'] && notesContainer['score'].length > 0) {
      //   console.log("notesContainer['score'] = ", notesContainer['score']);
      // }

      for(const channel in notesContainer) {
        if(channel !== 'click' && channel !== 'clack' && channel !== 'score') {
          continue;
        }

        const notes = notesContainer[channel];
        notes.forEach( (note) => {
          console.log("note = ", note);
          let noteOffset = 0;
          if(note.position) {
            const notePosition = note.position;

            noteOffset = positionsToSecondsDelta(notePosition, currentPosition, {
              tempo,
              timeSignature
            });
          } else {
            noteOffset = note.time - now;
          }

          const currentTime = performanceToAudioContextTime(performance.now(), {audioContext});

          const noteTime = Math.max(audioContext.currentTime,
                                    currentTime + parameters.lookAheadSeconds + noteOffset);

          // console.log('time', audioContext.currentTime,
          //             'compensated time', currentTime + parameters.lookAheadSeconds - noteDelay);

          // console.log('note', 'time', noteTime, 'delay', noteDelay,
          //             'pitch', note.pitch, 'intensity', note.intensity,
          //             'duration', note.duration);

          // console.log('currentTime', currentTime,
          //             'lookAheadSeconds', parameters.lookAheadSeconds,
          //             'noteOffset', noteOffset);
          // console.log('noteTime', noteTime,
          //             'delta', noteTime - noteTimeLast);

          noteTimeLast = noteTime;

          const noteDuration = beatsToSeconds(note.duration, {tempo, timeSignature});

          const env = audioContext.createGain();
          env.connect(audioOutNode);

          // env.gain.value = 0; // bug in Chrome? no sound when set
          env.gain.setValueAtTime(midiIntensityToAmplitude(note.intensity, {
            range: parameters.intensityRange,
          }),
                                  noteTime);
          env.gain.exponentialRampToValueAtTime(dBToAmplitude(-80), noteTime + noteDuration);

          const sine = audioContext.createOscillator();
          sine.connect(env);
          sine.frequency.value = midiPichToHertz(note.pitch);
          sine.start(noteTime);
          sine.stop(noteTime + noteDuration);
        });
      }
    },

    destroy() {

    },
  }
}