function clickSynth(graph, helpers, audioInNode, audioOutNode, outputFrame) {
  const app = (typeof global !== 'undefined' ? global.app : window.app);

  const conversion = app.imports.helpers.conversion;

  const dBToAmplitude = conversion.dBToAmplitude;
  const midiPichToHertz = conversion.midiPitchToHertz;
  const midiIntensityToAmplitude = conversion.midiIntensityToAmplitude;
  const positionsToSecondsDelta = conversion.positionsToSecondsDelta;
  const beatsToSeconds = conversion.beatsToSeconds;

  const audioContext = graph.como.audioContext;

  const activeChannels = new Set([
    'metronome',
    'beating',
    'scenario',
  ]);

  const parameters = {
    intensityRange: 30, // in dB
  };

  return {
    updateParams(updates) {
      Object.assign(parameters, updates);
    },

    // called on each sensor frame
    process(inputFrame, outputFrame) {
      const inputData = app.data;

      const lookAheadSeconds = inputData['lookAheadSeconds'];

      const currentPosition = inputData['position'];
      // use logical time tag from frame
      const now = inputData['time'].audio;

      const timeSignature = inputData['timeSignature'];
      const tempo = inputData['tempo'];

      const notesContainer = inputData['notes'];
      if(!notesContainer) {
        return;
      }

      for(const channel of Object.keys(notesContainer) ) {
        // do not play 'score' channel
        if(!activeChannels.has(channel) ) {
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

          // difference from logical time
          const timeOffset = audioContext.currentTime - now;

          // remove timeOffset from logical time to compensate,
          // add event offset and look-ahead
          const currentTime = audioContext.currentTime
                + lookAheadSeconds + noteOffset
                - timeOffset;

          const noteTime = Math.max(audioContext.currentTime, currentTime);

          // console.log('note', note,
          //             'offset', noteOffset,
          //             'from currentTime', (currentTime
          //                                  + lookAheadSeconds
          //                                  + noteOffset)
          //             - audioContext.currentTime,
          //             'noteTime', noteTime,
          //             'ac.currentTime', audioContext.currentTime);
          // console.log("lookAheadSeconds = ", lookAheadSeconds);

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