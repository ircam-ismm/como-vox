function reverberator(graph, helpers, audioInNode, audioOutNode, outputFrame) {
  const audioContext = graph.como.audioContext;

  const app = (typeof global !== 'undefined' ? global.app : window.app);
  const ReverberatorNode = app.imports.helpers.audio.ReverberatorNode;

  const parameters = {
    attackTime: 50e-3, // seconds
    decayTime: 1.5, // seconds 1
    lowpassFrequencyStart: 15000, // Hertz
    lowpassFrequencyEnd: 1000, // Hertz
    wetGain: -2., // dB, dryGain is automatic -2
  };

  const reverberatorNode = new ReverberatorNode({
    audioContext,
    ...parameters,
  });

  audioInNode.connect(reverberatorNode.inputNode);
  reverberatorNode.outputNode.connect(audioOutNode);

  return {
    updateParams(updates) {
      for(const p of Object.keys(updates) ) {
        if(parameters.hasOwnProperty(p) ) {
          parameters[p] = updates[p];
        }
      }
      reverberatorNode.set(parameters);
    },

    process(inputFrame) {
    },

    destroy() {
      reverberatorNode.inputNode.disconnect()
      reverberatorNode.outputNode.disconnect();
      reverberatorNode.free();
    },
  }
}