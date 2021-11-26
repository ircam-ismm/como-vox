function compressor(graph, helpers, audioInNode, audioOutNode, outputFrame) {
  const audioContext = graph.como.audioContext;

  const app = (typeof global !== 'undefined' ? global.app : window.app);
  const CompressorNode = app.imports.helpers.audio.CompressorNode;

  const parameters = {
    attack:
    10e-3, // seconds, quick
    release: 500e-3, // seconds, slow
    threshold: -3, // dB
    ratio: 20, // ratio, hard limiter
    knee: 3, // dB
    preGain: 6,
    postGain: -2, // dB, little headroom
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