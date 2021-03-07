function dataOutput(graph, helpers, outputFrame) {
  const app = (typeof global !== 'undefined' ? global.app : window.app);

  return {
    updateParams(updates) {
    },

    process(inputFrame, outputFrame) {
      const inputData = app.data;
      const outputData = outputFrame.data; // to graph

      for(const key of Object.keys(inputData) ) {
        outputData[key] = inputData[key];
      }

      return outputFrame;
    },

    destroy() {
    },

  };
}