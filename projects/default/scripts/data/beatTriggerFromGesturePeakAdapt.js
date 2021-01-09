function beatTriggerFromGestureMax(graph, helpers, outputFrame) {
  const app = (typeof global !== 'undefined' ? global.app : window.app);
  const conversion = app.imports.helpers.conversion;
  const secondsToBeats = conversion.secondsToBeats;
  const positionAddBeats = conversion.positionAddBeats;

  const feedbackIntensity = 0.7; //for the intensity factor initllay set to 0.7
  const gain = 1.0; // original gain  = 0.07 with acdeleramoeter / 9.81
  const meanStdOrder = 5;
  const deltaOrder = 5;
  const adaptThreshold = true
  const meanThresholdAdapt =  1; // factor to multiply standar deviation
  const meanThresholdMin =  50; // min threshold
  const timeIntervalThreshold = 0.2; //  0.2 in seconds
  const movingMeanStd = new helpers.algo.MovingMeanStd(meanStdOrder);
  const movingDelta = new helpers.algo.MovingDelta(deltaOrder);

  let lastBeatTime = null;
  let lastMean = +Infinity; // prevent kick on first frame
  let lastStd = 0; // prevent kick on first frame
  let maxIntensity = 0; // max value after detection
  let previousIntensity = 0; //intensity at previous frame
  let overMean = 0; // 1 if intensity > delta
  let delta = 0;
  let memory = 0; // intensity[time-1] 

  const parameters = {
    sensorsLatency: 1 / 60, // 60 Hz?
  };

  return {
    updateParams(updates) {
      Object.assign(parameters, updates);
    },

    process(inputFrame, outputFrame) {
      const inputData = inputFrame.data;
      const outputData = outputFrame.data;
   
      // use logical time tag from frame
      const now = inputData['time'];

      const timeSignature = inputData['timeSignature'];

      //const intensity = inputData['intensity'].linear;
      //const intensity = inputData['rotationRate'].alpha ** 2 +  inputData['rotationRate'].beta ** 2 +  inputData['rotationRate'].gamma ** 2;
      //const intensity = inputData['accelerationIncludingGravity'].x ** 2 +  inputData['accelerationIncludingGravity'].y ** 2 +  inputData['accelerationIncludingGravity'].z ** 2;


      // computing intensity using only one axis
      let intensity = inputData['accelerationIncludingGravity'].x;
      let value = Math.abs(movingDelta.process(intensity, inputData.metas.period));
      value = value + feedbackIntensity * memory; // store value for next pass
      memory = value;
      intensity = value * gain;

      delta = intensity - lastMean - (lastStd*meanThresholdAdapt + meanThresholdMin)

      // @TODO should compensate latency depending on algorithm
      const time = now - parameters.sensorsLatency;

      const beat = {
        time,
        trigger: 0,
        // for off-line analysis
        type: 'peak',
        intensity,
        delta,
        mean: lastMean,
      };

      if (overMean === 0) {
        if (delta > 0 && lastBeatTime === null) {
          overMean = 1;
          previousIntensity = intensity;
        }
      } else {
        if (intensity > previousIntensity) {
          previousIntensity = intensity;
        } else {
          lastBeatTime = now;
          beat.trigger = 1;
          maxIntensity = previousIntensity;
          previousIntensity = 0;
          overMean = 0;
        }
      }

      if (lastBeatTime !== null
          && now - lastBeatTime > timeIntervalThreshold) {
        lastBeatTime = null;
      }

      [lastMean, lastStd] = movingMeanStd.process(intensity);

      outputData['beat'] = beat;
      return outputFrame;
    },

    destroy() {

    },
  }
}