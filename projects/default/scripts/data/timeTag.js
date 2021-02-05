function timeTag(graph, helpers, outputFrame) {
  const audioContext = graph.como.audioContext;

  const app = (typeof global !== 'undefined' ? global.app : window.app);

  const time = app.imports.helpers.time;
  const getTime = time.getTime;

  return {
    updateParams(updates) {
    },

    process(inputFrame, outputFrame) {
      const inputData = inputFrame.data;
      const outputData = outputFrame.data;

      const audio = audioContext.currentTime;
      const performance = getTime();

      outputData['time'] = {
        audio,
        performance,
      };
      app.data.time = time;

      return outputFrame;
    },

    destroy() {
    },

  };
}