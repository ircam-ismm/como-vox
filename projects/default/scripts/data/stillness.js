function stillness(graph, helpers, outputFrame) {
  const app = (typeof global !== 'undefined' ? global.app : window.app);

  let status = false;
  let duration = 0; // in seconds
  let startTime = {
    audio: 0,
    local: 0,
  };


  const parameters = {
    stillnessIntensityMin: 1e-4,
  };

  const updateParams = (updates) => {
    for(const p of Object.keys(updates) ) {
      if(parameters.hasOwnProperty(p) ) {
        parameters[p] = updates[p];
      }
    }
  };

  return {
    updateParams,

    process(inputFrame, outputFrame) {
      const inputData = app.data;
      const outputData = app.data;

      const time = inputData['time'];
      const intensity = inputData['intensity'].linear;

      const statusNew = intensity <= parameters.stillnessIntensityMin;
      if(statusNew !== status) {
        startTime = time;
        status = statusNew;
      }
      duration = time.local - startTime.local;

      const stillnessContainer = {
        status,
        duration,
        startTime,
      };

      outputData['stillness'] = stillnessContainer;
      return outputFrame;
    },

    destroy() {
    },

  };
}