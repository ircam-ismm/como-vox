function compressor(graph, helpers, audioInNode, audioOutNode, outputFrame) {
  const app = (typeof global !== 'undefined' ? global.app : window.app);
  const conversion = app.imports.helpers.conversion;
  const dBToAmplitude = conversion.dBToAmplitude;

  const audioContext = graph.como.audioContext;

  const parameters = {
    attack: 10e-3, // seconds, quick
    release: 250e-3, // seconds, slow
    threshold: -3, // dB
    ratio: 20, // ratio, hard limiter
    knee: 3, // dB
    postGain: -1, // dB, little headroom
  }

  const compressorNode = audioContext.createDynamicsCompressor();
  const postGainNode = audioContext.createGain();

  audioInNode.connect(compressorNode);
  compressorNode.connect(postGainNode);
  postGainNode.connect(audioOutNode);

  const init = () => {
    compressorNode.attack.value = parameters.attack;
    compressorNode.release.value = parameters.release;

    // WebAudio compressor node adds knee to threshold (sic)
    // https://webaudio.github.io/web-audio-api/#DynamicsCompressorOptions-processing
    compressorNode.threshold.value = parameters.threshold - 0.5 * parameters.knee;
    compressorNode.ratio.value = parameters.ratio;
    compressorNode.knee.value = parameters.knee;

    const postGain = dBToAmplitude(parameters.postGain);
    postGainNode.gain.value = postGain;
    postGainNode.gain.setValueAtTime(postGain, audioContext.currentTime);
  }

  init();

  return {
    updateParams(updates) {
      for(const p of Object.keys(updates) ) {
        if(parameters.hasOwnProperty(p) ) {
          parameters[p] = updates[p];
        }
      }

      init();
    },

    process(inputFrame) {
      // const reduction = (typeof compressorNode.reduction.value !== 'undefined'
      //                    ? compressorNode.reduction.value
      //                    : compressorNode.reduction);

      // console.log('compressor reduction', reduction.toFixed(1) );
    },

    destroy() {
      audioInNode.disconnect(compressorNode);
      compressorNode.disconnect();
      postGainNode.disconnect();
    },
  }
}