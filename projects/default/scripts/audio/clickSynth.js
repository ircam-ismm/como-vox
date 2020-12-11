function clickSynth(graph, helpers, audioInNode, audioOutNode, outputFrame) {
  const app = (typeof process !== 'undefined' ? process.app : window.app);

  const conversion = app.imports.helpers.conversion;

  const midiPichToHertz = conversion.midiPitchToHertz;
  const midiIntensityToAmplitude = conversion.midiIntensityToAmplitude;
  const positionsToSecondsDelta = conversion.positionsToSecondsDelta;
  const performanceToAudioContextTime = conversion.performanceToAudioContextTime;
  const beatsToSeconds = conversion.beatsToSeconds;

  const audioContext = graph.como.audioContext;

  const parameters = {
    lookAheadSeconds: 0,
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
          const now = performance.now() * 1e-3;

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

          const currentTime = performanceToAudioContextTime(now * 1e3, {audioContext});

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
          env.gain.setValueAtTime(midiIntensityToAmplitude(note.intensity), noteTime);
          env.gain.exponentialRampToValueAtTime(0.0001, noteTime + noteDuration);

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
