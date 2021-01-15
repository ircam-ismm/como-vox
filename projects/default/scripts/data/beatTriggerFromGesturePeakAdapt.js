function beatTriggerFromGestureMax(graph, helpers, outputFrame) {
  const app = (typeof global !== 'undefined' ? global.app : window.app);
  const conversion = app.imports.helpers.conversion;
  const secondsToBeats = conversion.secondsToBeats;
  const positionAddBeats = conversion.positionAddBeats;

  const feedbackFactor = 0.8; //for the intensity factor initllay set to 0.7
  const gain = 1.; // original gain  = 0.07 with acdeleramoeter / 9.81
  const deltaOrder = 5;
  const movingDelta = new helpers.algo.MovingDelta(deltaOrder);
  const averageOrder = 5;
  const movingAverage = new helpers.algo.MovingAverage(averageOrder);
  
  const meanThresholdAdapt =  0.5 // factor to multiply standar deviation
  const meanThresholdMin = 4 // min threshold
  const timeIntervalThreshold = 0.3; //  0.2 in seconds
  const meanStdOrder = 5;
  const movingMeanStd = new helpers.algo.MovingMeanStd(meanStdOrder);

  let lastBeatTime = null;
  let lastMean = +Infinity; // prevent kick on first frame
  let lastStd = 0; // prevent kick on first frame
  let previousIntensity = 0; //intensity at previous frame
  let positiveDelta = 0; // 1 if intensity > delta
  let delta = 0;
  let value = 0
  let memory = 0; // intensity[time-1] 
  let oldDelta = -1;
  let detection = 0;

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
      const acceleration = inputData['accelerationIncludingGravity'].x;
      let derivate = movingDelta.process(acceleration, inputData.metas.period);
      value = Math.abs(derivate, 0) + feedbackFactor * memory; // store value for next pass
      memory = value;
      let intensity = value * gain;
      let intensityFiltered = movingAverage.process(intensity);
      
      //console.log(now);

      delta = intensityFiltered - lastMean - lastStd*meanThresholdAdapt - meanThresholdMin

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

      // not working
      // if (detection === 0) {
      //   if (Math.sign(delta) > 0 && Math.sign(oldDelta) < 0) {
      //     detection = 1;
      //     previousIntensity = intensityFiltered;
      //     //beat.trigger = 1;
      //   }  
      // } else {
      //   if (intensityFiltered > previousIntensity) {
      //     previousIntensity = intensityFiltered;
      //   } else {
      //     if (intensityFiltered < previousIntensity && (now - lastBeatTime) > timeIntervalThreshold) {
      //       beat.trigger = 1;
      //       beat.intensity = intensityFiltered;
      //       detection = 0;
      //       previousIntensity = 0;
      //       lastBeatTime = now;
      //     }
      //   }
      // }

      //console.log(intensity);

      if (positiveDelta === 0) {
        if (delta > 0 && lastBeatTime === null) {
          positiveDelta = 1;
          previousIntensity = intensityFiltered;
        }
      } else {
        if (intensityFiltered > previousIntensity) {
          previousIntensity = intensityFiltered;
        } else {
          lastBeatTime = now;
          beat.trigger = 1;
          beat.intensity = intensityFiltered;
          previousIntensity = 0;
          positiveDelta = 0;
        }
      }

      if (lastBeatTime !== null
          && now - lastBeatTime > timeIntervalThreshold) {
        lastBeatTime = null;
      }

      [lastMean, lastStd] = movingMeanStd.process(intensityFiltered);
      oldDelta = delta;
      outputData['beat'] = beat;
      return outputFrame;
    },

    destroy() {

    },
  }
}