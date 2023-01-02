function compressor(graph, helpers, audioInNode, audioOutNode, outputFrame) {
  const audioContext = graph.como.audioContext;

  const app = (typeof global !== 'undefined' ? global.app : window.app);
  const CompressorNode = app.imports.helpers.audio.CompressorNode;

  const parameters = {
    attack:
    10e-3, // seconds, quick 10e-3,
    release: 500e-3, // seconds, slow  500e-3
    threshold: -6, // dB -6
    ratio: 20, // ratio, hard limiter 20
    knee: 6, // dB  6
    preGain: 6, // 6
    postGain: -2, // dB, little headroom -2
  };

  const compressorNode = new CompressorNode({
    audioContext,
    ...parameters,
  });

  audioInNode.connect(compressorNode.inputNode);
  compressorNode.outputNode.connect(audioOutNode);

  return {
    updateParams(updates) {
      for(const p of Object.keys(updates) ) {
        if(parameters.hasOwnProperty(p) ) {
          parameters[p] = updates[p];
        }
      }
      compressorNode.set(parameters);
    },

    process(inputFrame) {
      // const reduction = compressorNode.getReduction();
      // console.log('compressor reduction', reduction.toFixed(1) );
    },

    destroy() {
      compressorNode.inputNode.disconnect()
      compressorNode.outputNode.disconnect();
      compressorNode.free();
    },
  }
}