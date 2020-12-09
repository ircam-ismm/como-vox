function clickSynth(graph, helpers, audioInNode, audioOutNode, outputFrame) {
  const app = (typeof process !== 'undefined' ? process.app : window.app);

  const conversion = app.imports.helpers.conversion;

  const midiPichToHertz = conversion.midiPitchToHertz;
  const midiIntensityToAmplitude = conversion.midiIntensityToAmplitude;
  const positionsToSecondsDelta = conversion.positionsToSecondsDelta;
  const performanceToAudioContextTime = conversion.performanceToAudioContextTime;
  const beatsToSeconds = conversion.beatsToSeconds;

  const audioContext = graph.como.audioContext;

  let noteTimeLast = 0;

  return {
    updateParams(updates) {

    },

    // called on each sensor frame
    process(inputFrame, outputFrame) {
      const inputData = inputFrame.data;

      const currentPosition = inputData['position'];
      const timeSignature = inputData['timeSignature'];
      const tempo = inputData['tempo'];

      const lookAhead = 1; // in seconds

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

          const notePosition = note.position;

          const delay = positionsToSecondsDelta(currentPosition, notePosition, {
            tempo,
            timeSignature
          });

          const currentTime = performanceToAudioContextTime(performance.now(),
                                                            {audioContext});

          const noteTime = currentTime + lookAhead - delay;

          // console.log('currentTime', currentTime, 'lookAhead', lookAhead,
          //             'delay', delay);
          // console.log('noteTime', noteTime, 'delta', noteTime - noteTimeLast);

          noteTimeLast = noteTime;

          const noteDuration = beatsToSeconds(note.duration, {tempo, timeSignature});

          const env = audioContext.createGain();
          env.connect(audioOutNode);
          env.gain.value = 0;
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
