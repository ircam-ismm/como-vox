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

  // @TODO: useless
  const rotationThresholdSensitive = 1; // sensitive
  const rotationThresholdSafe = 1; // safe
  let rotationThreshold = rotationThresholdSafe;

  const peakThresholdSensitive = 30; // sensitive
  const peakThresholdSafe = 100; // safe
  let peakThreshold = peakThresholdSafe;


  const intensityRotationUnfilteredMax = 100; // clip for hysteresis
  let inhibitionLimits = {
    min: 0.25, // seconds
    max: 0.5, // seconds
    beats: 0.5,
  };
  let peakSearchLimits = {
    min: 0.25, // seconds
    max: 0.5, // seconds
    beats: 0.5,
  };

  // other parameters

  //acceleration filtering
  const accelerationAverageOrder = 2;
  const accelerationAverageLatency = accelerationAverageOrder / 2; // half window
  const movingAverage = new helpers.algo.MovingAverage(accelerationAverageOrder);

  // computing intensity
  const deltaOrder = 10; // 20
  const deltaLatency = deltaOrder / 2; // half window

  const feedbackFactor = 0.8; //for the intensity factor initially set to 0.7
  // integration removes some of the delta latency, hence the negative sign
  const feedbackLatency = -deltaLatency * feedbackFactor; // rule of thumb

  const intensityNormalisation = 1.; // original gain  = 0.07 with accelerometer / 9.81
  let handednessNormalisation = 1; // right hand is 1, left is -1

  const sensorsLatency = 1;
  // latency in samples
  const analysisLatency = sensorsLatency + accelerationAverageLatency
        + deltaLatency + feedbackLatency;

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
  let delta = 0;
  let intensity = 0;
  let previousIntensity = 0; //intensity at previous frame
  let lastDelta = -1;

  const PeakSearch = class {
    constructor({startTime, searchDuration}) {
      this.startTime = startTime;
      this.peakFound = false;
      this.searchDuration = searchDuration;
      this.peakIntensity = 0;
      this.peakTime = startTime;
    }

    process({time, intensity}) {
      if(time - this.startTime < this.searchDuration) {
        if(intensity > this.peakIntensity) {
          this.peakIntensity = intensity;
          this.peakTime = time;
        }
      } else {
        this.peakFound = true;
      }
      return this;
    }

  };
  const peakSearches = new Set();

  // shared parameters, according to player schema
  const parameters = {
    handedness: null,
    playback : 0,
  };

  const updateParams = (updates) => {
    for(const p of Object.keys(updates) ) {
      switch(p) {
        case 'handedness': {
          handednessNormalisation = (updates['handedness'] === 'left'
                                     ? -1
                                     : 1);
          break;
        }

        case 'playback': {
          const playback = updates['playback'];
          rotationThreshold = (playback
                               ? rotationThresholdSensitive
                               : rotationThresholdSafe);

          peakThreshold = (playback
                           ? peakThresholdSensitive
                           : peakThresholdSafe);
          break;
        };

        default: {
          break;
        }
      }

      if(parameters.hasOwnProperty(p) ) {
        parameters[p] = updates[p];
      }
    }
  };

  ///// Events and data (defined only in browser)
  const registeredEvents = [];
  if(app.events && app.state) {
    [
      'handedness',
      'playback',
    ].forEach( (event) => {
      const callback = (value) => {
        // compatibility with setGraphOption
        updateParams({[event]: value});
      };
      registeredEvents.push([event, callback]);
      app.events.on(event, callback);
      // apply current state
      updateParams({[event]: app.state[event]});
    });
  }

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
    updateParams,

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

      const time = now - inputData.metas.period * analysisLatency;

      // adapt inhibition to current playing
      const tempo = inputData['tempo'];
      const timeSignature = inputData['timeSignature'];

      const inhibitionDuration
            = Math.max(inhibitionLimits.min,
                       Math.min(inhibitionLimits.max,
                                beatsToSeconds(inhibitionLimits.beats, {tempo, timeSignature})));
      const peakSearchDuration
            = Math.max(peakSearchLimits.min,
                       Math.min(peakSearchLimits.max,
                                beatsToSeconds(peakSearchLimits.beats, {tempo, timeSignature})));


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
      const accelerationFiltered = movingAverage.process(
        acceleration * intensityNormalisation * handednessNormalisation);

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
      const intensityNormalized = intensity;

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

      const onset = intensityRotation > rotationThreshold && delta > 0 && lastDelta < 0;
      // new search process on each onset
      if(onset) {
        peakSearches.add(new PeakSearch({
          startTime: time,
          searchDuration: peakSearchDuration,
        }) );
      }

      peakSearches.forEach( (search) => {
        const result = search.process({
          time,
          intensity: intensityNormalized,
        });

        if(result.peakFound) {
          peakSearches.delete(search);
          // filter peaks
          if(result.peakTime - lastBeatTime > inhibitionDuration
             && result.peakIntensity > peakThreshold) {
            beat.timeOnset = result.startTime;
            beat.trigger = (result.peakFound ? 1 : 0);
            beat.time = result.peakTime;
            beat.intensity = result.peakIntensity;
            beat.timeMax = result.peakTime;

            lastBeatTime = result.peakTime;
          }
        }
      });

      [lastMean, lastStd] = movingMeanStd.process(intensityNormalized);
      lastDelta = delta;
      outputData['beat'] = beat;

      return outputFrame;
    },

    destroy() {
      registeredEvents.forEach( ([event, callback]) => {
        app.events.removeListener(event, callback);
      });
    },
  }
}