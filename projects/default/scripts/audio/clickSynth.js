function clickSynth(graph, helpers, audioInNode, audioOutNode, outputFrame) {
  const app = (typeof global !== 'undefined' ? global.app : window.app);

  const conversion = app.imports.helpers.conversion;

  const dBToAmplitude = conversion.dBToAmplitude;
  const midiPichToHertz = conversion.midiPitchToHertz;
  const midiIntensityToAmplitude = conversion.midiIntensityToAmplitude;
  const positionsToSecondsDelta = conversion.positionsToSecondsDelta;
  const performanceToAudioContextTime = conversion.performanceToAudioContextTime;
  const beatsToSeconds = conversion.beatsToSeconds;

  const audioContext = graph.como.audioContext;

  const parameters = {
    lookAheadSeconds: 0,
    intensityRange: 30, // in dB
  };

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

      for(const channel in notesContainer) {
        if(channel !== 'click' && channel !== 'clack') {
          continue;
        }

        const notes = notesContainer[channel];
        notes.forEach( (note) => {
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
          // console.log('note', note,
          //             'offset', noteOffset,
          //             'from currentTime', (currentTime
          //                                  + parameters.lookAheadSeconds
          //                                  + noteOffset)
          //             - audioContext.currentTime,
          //             'noteTime', noteTime,
          //             'ac.currentTime', audioContext.currentTime);
          // console.log("parameters.lookAheadSeconds = ", parameters.lookAheadSeconds);

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