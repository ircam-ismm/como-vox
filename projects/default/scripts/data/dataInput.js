function dataInput(graph, helpers, outputFrame) {
  const app = (typeof global !== 'undefined' ? global.app : window.app);

  return {
    updateParams(updates) {
    },

    process(inputFrame, outputFrame) {
      const inputData = inputFrame.data;
      const outputData = app.data;

      for(const key of Object.keys(inputData) ) {
        outputData[key] = inputData[key];
      }

      return outputFrame;
    },

    destroy() {
    },

  };
}