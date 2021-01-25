function beatTriggerFromGesturePeakAdapt(graph, helpers, outputFrame) {
  const app = (typeof global !== 'undefined' ? global.app : window.app);
  const conversion = app.imports.helpers.conversion;
  const secondsToBeats = conversion.secondsToBeats;
  const positionAddBeats = conversion.positionAddBeats;

  const feedbackFactor = 0.8; //for the intensity factor initllay set to 0.7
  const gain = 1.; // original gain  = 0.07 with acdeleramoeter / 9.81
  const deltaOrder = 10;
  const movingDelta = new helpers.algo.MovingDelta(deltaOrder);
  const averageOrder = 2;
  const movingAverage = new helpers.algo.MovingAverage(averageOrder);
  
  const meanThresholdAdapt =  1 // factor to multiply standar deviation
  const meanThresholdMin = 5 // min threshold
  const timeIntervalThreshold = 0.2; //  0.2 in seconds
  const meanStdOrder = 20;
  const movingMeanStd = new helpers.algo.MovingMeanStd(meanStdOrder);
  const windowMax = 0.3; // in seconds
  const thresholdRotation = 0;

  // initatilistion
  let lastBeatTime = null;
  let lastMean = +Infinity; // prevent kick on first frame
  let lastStd = 0; // prevent kick on first frame
  let previousIntensity = 0; //intensity at previous frame
  let positiveDelta = 0; // 1 if intensity > delta
  let delta = 0;
  let value = 0
  let memory = 0; // intensity[time-1] 
  let lastDelta = -1;
  let detection = 0;
  let onsetTime = 0;
  let timeMax = 0;
  let tempMax = 0;

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
      const intensityRotation = Math.pow(inputData['rotationRate'].alpha ** 2 +  inputData['rotationRate'].beta ** 2 +  inputData['rotationRate'].gamma ** 2, 0.5);
      //const intensity = inputData['accelerationIncludingGravity'].x ** 2 +  inputData['accelerationIncludingGravity'].y ** 2 +  inputData['accelerationIncludingGravity'].z ** 2;
      //console.log(intensityRotation);

      // computing intensity using only one axis
      const acceleration = inputData['accelerationIncludingGravity'].x;
      let derivate = movingDelta.process(acceleration, inputData.metas.period);
      value = Math.max(derivate, 0) + feedbackFactor * memory; // store value for next pass
      memory = value;
      let intensity = value * gain;
      let intensityFiltered = movingAverage.process(intensity);
      
     

      delta = intensityFiltered - lastMean - lastStd*meanThresholdAdapt - meanThresholdMin

      // @TODO should compensate latency depending on algorithm
      //const time = now - parameters.sensorsLatency;
      const time = now - inputData.metas.period * (1 + (deltaOrder + averageOrder)/2)  
      
      const beat = {
        time,
        trigger: 0,
        type: 'peak',
        intensity: 0,
        // for off-line analysis

        timePlot: time,
        timeOnset: 0,
        timeMax: 0,
        acceleration,
        derivate,
        intensity,
        intensityFiltered,
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
      //positiveDelta = 0;
      if (time - lastBeatTime > timeIntervalThreshold && intensityRotation > thresholdRotation) {
        
        if (positiveDelta === 0) {
         if (delta > 0 && lastDelta < 0) {
            positiveDelta = 1;
            timeOnset = time;
            beat.timeOnset = timeOnset;
            tempMax = previousIntensity;
            } 

        } else {
          if (time - onsetTime < windowMax) {
            if (intensityFiltered > tempMax) {
              tempMax = intensityFiltered;
              timeMax = time;
            }
          } else {
            beat.trigger = 1;  
            beat.time =timeMax;
            beat.timeMax = timeMax;
            beat.intensity = tempMax;
            previousIntensity = 0;
            positiveDelta = 0;
            lastBeatTime = timeMax;
            tempMax = 0;
            timeMax = 0;
          }

        }
      } 

      // if (lastBeatTime !== null
      //     && now - lastBeatTime > timeIntervalThreshold) {
      //   lastBeatTime = null;
      // }
      console.log(timeMax);
      [lastMean, lastStd] = movingMeanStd.process(intensityFiltered);
      lastDelta = delta;
      outputData['beat'] = beat;
      return outputFrame;
    },

    destroy() {

    },
  }
}