function timeTag(graph, helpers, outputFrame) {
  const audioContext = graph.como.audioContext;

  const app = (typeof global !== 'undefined' ? global.app : window.app);

  const getLocalTime = app.imports.helpers.time.getLocalTime;

  return {
    updateParams(updates) {
    },

    process(inputFrame, outputFrame) {
      const inputData = inputFrame.data;
      const outputData = outputFrame.data;

      const audio = audioContext.currentTime;
      const local = getLocalTime();

      const time = {
        audio,
        local,
      };
      outputData['time'] = time;
      app.data.time = time;

      return outputFrame;
    },

    destroy() {
    },

  };
}