function beatTriggerFromGesturePeakAdapt(graph, helpers, outputFrame) {
  
  const app = (typeof global !== 'undefined' ? global.app : window.app);
  const conversion = app.imports.helpers.conversion;
  const beatsToSeconds = conversion.beatsToSeconds;
  const secondsToBeats = conversion.secondsToBeats;
  const positionAddBeats = conversion.positionAddBeats;
  const positionDeltaToSeconds = conversion.positionDeltaToSeconds;

  const Hysteresis = app.imports.helpers.Hysteresis;

  // important parameters for sensitivity
  const meanThresholdAdapt =  1.; // factor to multiply standars deviation //1
  const meanThresholdMin = 10; // min threshold 5
  const rotationThreshold = 20;
  const intensityRotationUnfilteredMax = 100; // 
  let inhibition = {
    min: 0.25, // seconds
    max: 0.5, // seconds
    beats: 0.5,
  };
  let peakSearch = {
    min: 0.35, // seconds
    max: 0.5, // seconds
    beats: 0.5,
  };

  // other parameters

  //acceleration filtering
  const accelerationAverageOrder = 2;
  const movingAverage = new helpers.algo.MovingAverage(accelerationAverageOrder);
  
  // computing intensity
  const feedbackFactor = 0.8; //for the intensity factor initially set to 0.7
  const intensityNormalisation = 1.; // original gain  = 0.07 with accelerometer / 9.81
  const deltaOrder = 10; //20
  const movingDelta = new helpers.algo.MovingDelta(deltaOrder);
  
  //onset detection
  const onsetMeanStdOrder = 10;
  const movingMeanStd = new helpers.algo.MovingMeanStd(onsetMeanStdOrder);
 
  // orientation intensity filtering
  const rotationAverageOrder = 20;
  const rotationMovingAverage = new helpers.algo.MovingAverage(rotationAverageOrder);

  let inputSamplePeriod = 0.02; // seconds

  const rotationIntensityLowpassDown = {
    bar: 0.5,
    beat: 0,
  }; // 1 bar to go down

  const rotationIntensitySmoother = new Hysteresis({
    sampleRate: 1 / inputSamplePeriod, // update later
    lowpassFrequencyUp: 10, // Hz: 180 bpm
    lowpassFrequencyDown: 1 / positionDeltaToSeconds(rotationIntensityLowpassDown, {
      tempo: 60, // bpm, will update later
      timeSignature: {
        count: 4,
        division: 4,
      },
    }),
  });

  // initialisation
  let lastBeatTime = 0;
  let lastMean = +Infinity; // prevent kick on first frame
  let lastStd = 0; // prevent kick on first frame
  let positiveDelta = 0; // 1 if intensity > delta
  let delta = 0;
  let intensity = 0;
  let previousIntensity = 0; //intensity at previous frame
  let lastDelta = -1;
  let timeOnset = 0;
  let timeMax = 0;
  let tempMax = 0;

 // debug
  const barGraph = (value, {
    peak = undefined,
    valueMin = 0,
    valueMax = 1,
    segmentCount = 80,
    segmentCharacter = '-',
    segmentCharacterZero = 'o',
    segmentCharacterClip = '*',
    segmentCharacterPeak = '+',
  } = {}) => {
    const range = valueMax - valueMin;

    const valueToCount = (value) => {
      return Math.abs(Math.round(
        (Math.min(valueMax,
                  Math.max(valueMin, value) )
         - valueMin)
          / range * segmentCount) );
    };

    const segmentActiveCount = valueToCount(value);
    let segments = new Array(segmentCount).fill(' ');

    if(segmentActiveCount === 0) {
      segments[0] = segmentCharacterZero;
    }

    for(let s = 0; s < segmentActiveCount && s < segmentCount; ++s) {
      segments[s] = segmentCharacter;
    }

    if(segmentActiveCount >= segmentCount) {
      segments[segments.length - 1] = segmentCharacterClip;
    } else if(typeof peak !== 'undefined') {
      const segmentPeak = valueToCount(peak);
      segments[segmentPeak] = segmentCharacterPeak;
    }

    return segments.join('');
  };

  return {
    updateParams(updates) {
    },

    process(inputFrame, outputFrame) {
      const inputData = app.data;
      const outputData = app.data;

      // use logical time tag from frame
      const now = inputData['time'].local;

      if(inputSamplePeriod !== inputData.metas.period) {
        inputSamplePeriod = input.metas.period;
        rotationIntensitySmoother.set({
          sampleRate: 1 / inputSamplePeriod,
        });
      }

      // latency estimation
      const sensorsLatency = inputData.metas.period;
      const time = now - sensorsLatency
            - inputData.metas.period * (deltaOrder + accelerationAverageOrder)/2; // 3?

      // adapt inhibition to current playing
      const tempo = inputData['tempo'];
      const timeSignature = inputData['timeSignature'];

      const inhibitionDuration
            = Math.max(inhibition.min,
                       Math.min(inhibition.max,
                                beatsToSeconds(inhibition.beats, {tempo, timeSignature})));
      const peakSearchDuration
            = Math.max(peakSearch.min,
                       Math.min(peakSearch.max,
                                beatsToSeconds(peakSearch.beats, {tempo, timeSignature})));


      // rotation intensity computing
      const intensityRotationUnfiltered = Math.pow(inputData['rotationRate'].alpha ** 2
                                         + inputData['rotationRate'].beta ** 2
                                         + inputData['rotationRate'].gamma ** 2,
                                         0.5);

      const lowpassFrequencyDown =
            1 / positionDeltaToSeconds(rotationIntensityLowpassDown, {
              tempo,
              timeSignature,
            });

      const intensityRotationClipped = Math.min(intensityRotationUnfilteredMax, 
                                                intensityRotationUnfiltered);

      rotationIntensitySmoother.set({lowpassFrequencyDown});
      const intensityRotation = rotationIntensitySmoother.process(intensityRotationClipped);

      // // debug visualization  
      // console.log('intensityRotation',
      //             (Math.round(100 * intensityRotation) * 0.01).toFixed(3),
      //             barGraph(intensityRotation, {
      //               peak: intensityRotationClipped,
      //               valueMin: 0,
      //               valueMax: intensityRotationUnfilteredMax,
      //               segmentCharacter: '-'}) );


      // const intensityRotation = rotationMovingAverage.process(intensityRotationUnfiltered);

      // computing intensity using only one axis
      const acceleration = inputData['accelerationIncludingGravity'].x;

      // compute 1D acceleration intensity
      const accelerationFiltered = movingAverage.process(acceleration);
      let derivate = movingDelta.process(accelerationFiltered, inputData.metas.period);
      intensity = Math.max(derivate, 0) + feedbackFactor * previousIntensity;
      // store value for next pass
      previousIntensity = intensity;

      //other possible choices
      //const intensity = inputData['intensity'].linear;
      // const intensity = inputData['accelerationIncludingGravity'].x ** 2
      //       + inputData['accelerationIncludingGravity'].y ** 2
      //       + inputData['accelerationIncludingGravity'].z ** 2;


      // normalisation and filtering
      const intensityNormalized = intensity * intensityNormalisation;

      // delta computing
      delta = intensityNormalized - lastMean - lastStd*meanThresholdAdapt - meanThresholdMin;

      // data structure to output
      const beat = {
        time,
        trigger: 0,
        type: 'peak',

        // for off-line analysis
        timePlot: time,
        timeOnset: 0,
        timeMax: 0,
        acceleration,
        derivate,
        intensity,
        intensityNormalized,
        intensityRotation,
        delta,
        mean: lastMean,
        std: lastStd,
      };

      // inhibition after last beat
      if (time - lastBeatTime > inhibitionDuration) {

        if (positiveDelta === 0) {
          // onset detection
          if (intensityRotation > rotationThreshold && delta > 0 && lastDelta < 0) {
            positiveDelta = 1;
            timeOnset = time;
            beat.timeOnset = timeOnset;
            tempMax = 0;
            timeMax = time;
          }
        } else {
          // peak detection
          if (time - timeOnset < peakSearchDuration) {
            if (intensityNormalized > tempMax) {
              tempMax = intensityNormalized;
              timeMax = time;
            }
          } else {
            beat.trigger = 1;
            beat.time = timeMax;
            beat.timeMax = timeMax;
            beat.intensity = tempMax;
            positiveDelta = 0;
            lastBeatTime = timeMax;
            tempMax = 0;
            timeMax = 0;

            // console.log('beat', {...beat},
            //             'from now', beat.time - now,
            //             'from compensated time', beat.time - time);
          }
        }
      }

      [lastMean, lastStd] = movingMeanStd.process(intensityNormalized);
      lastDelta = delta;
      outputData['beat'] = beat;
      return outputFrame;
    },

    destroy() {

    },
  }
}