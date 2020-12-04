function clickSynth(graph, helpers, audioInNode, audioOutNode, outputFrame) {
  const app = (typeof process !== 'undefined' ? process.app : window.app);

  const midiPichToHertz = app.imports.helpers.conversion.midiPitchToHertz;
  const midiIntensityToAmplitude = app.imports.helpers.conversion.midiIntensityToAmplitude;

  const audioContext = graph.como.audioContext;

  return {
    updateParams(updates) {

    },
    // called on each sensor frame
    process(inputFrame, outputFrame) {
      const inputData = inputFrame.data;
      // const inputData = window.app.data;

      const notes = inputData['notes'];
      if(!notes) {
        return;
      }

      notes.forEach( (note) => {
        if(note.channel === 'click') {
          // we should trigger the next beat, taking latency into account...
          // we have a lot of jitter in Android
          // adding 0.02 to currentCurrent time seems to prevent
          // dropouts in Android (at least less than using currentTime only...
          const now = audioContext.currentTime + 0.02;

          const env = audioContext.createGain();
          env.connect(audioOutNode);
          env.gain.value = 0;
          env.gain.setValueAtTime(midiIntensityToAmplitude(note.intensity), now);
          env.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

          const sine = audioContext.createOscillator();
          sine.connect(env);
          sine.frequency.value = midiPichToHertz(note.pitch);
          sine.start(now);
          sine.stop(now + note.duration);
        }
      });
    },

    destroy() {

    },
  }
}
