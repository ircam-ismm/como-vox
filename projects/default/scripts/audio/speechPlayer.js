function speechPlayer(graph, helpers, audioInNode, audioOutNode, outputFrame) {
  const app = (typeof global !== 'undefined' ? global.app : window.app);

  const conversion = app.imports.helpers.conversion;

  const dBToAmplitude = conversion.dBToAmplitude;
  const midiIntensityToAmplitude = conversion.midiIntensityToAmplitude;
  const positionsToSecondsDelta = conversion.positionsToSecondsDelta;
  const beatsToSeconds = conversion.beatsToSeconds;

  const audioContext = graph.como.audioContext;

  const sampleManager = app.instruments.speechSampleManager;

  const activeChannels = new Set([
    'scenario',
  ]);

  const parameters = {
    audioIntensityRange: 30, // in dB
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

      const speechContainer = inputData['speech'];
      if(!speechContainer) {
        return;
      }

      for(const channel of Object.keys(speechContainer) ) {
        // do not play 'score' channel
        if(!activeChannels.has(channel) ) {
          continue;
        }

        const speeches = speechContainer[channel];
        speeches.forEach( (speech) => {
          let speechOffset = 0;
          if(speech.position) {
            const speechPosition = speech.position;

            speechOffset = positionsToSecondsDelta(speechPosition, currentPosition, {
              tempo,
              timeSignature
            });
          } else {
            speechOffset = speech.time - now;
          }

          // difference from logical time
          const timeOffset = audioContext.currentTime - now;

          // remove timeOffset from logical time to compensate,
          // add event offset and look-ahead
          const currentTime = audioContext.currentTime
                + lookAheadSeconds + speechOffset
                - timeOffset;

          const speechTime = Math.max(audioContext.currentTime, currentTime);

          const buffer = sampleManager.get(speech.sample);
          if(buffer) {
            const source = audioContext.createBufferSource();
            source.buffer = buffer;

            const envelope = audioContext.createGain();
            source.connect(envelope);
            envelope.gain.value = midiIntensityToAmplitude(speech.intensity, {
              range: parameters.audioIntensityRange,
            });

            envelope.connect(audioOutNode);
            source.start(speechTime);
          } else {
            // sample sound not available (yet?)
            console.error('no sample for', speech.sample);
          }

        });
      }
    },

    destroy() {

    },
  }
}