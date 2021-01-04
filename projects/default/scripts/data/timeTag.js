function timeTag(graph, helpers, outputFrame) {
  const app = (typeof global !== 'undefined' ? global.app : window.app);

  const time = app.imports.helpers.time;
  const getTime = time.getTime;

  return {
    updateParams(updates) {
    },

    process(inputFrame, outputFrame) {
      const inputData = inputFrame.data;
      const outputData = outputFrame.data;

      const now = getTime();

      outputData['time'] = now;
      return outputFrame;
    },

    destroy() {
    },

  };
}