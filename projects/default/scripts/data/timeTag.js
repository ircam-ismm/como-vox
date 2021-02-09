function timeTag(graph, helpers, outputFrame) {
  const audioContext = graph.como.audioContext;

  const app = (typeof global !== 'undefined' ? global.app : window.app);

  const time = app.imports.helpers.time;
  const getLocalTime = time.getLocalTime;

  return {
    updateParams(updates) {
    },

    process(inputFrame, outputFrame) {
      const inputData = inputFrame.data;
      const outputData = outputFrame.data;

      const audio = audioContext.currentTime;
      const local = getLocalTime();

      outputData['time'] = {
        audio,
        local,
      };
      app.data.time = time;

      return outputFrame;
    },

    destroy() {
    },

  };
}