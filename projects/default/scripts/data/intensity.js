function intensityFromGestureHysteresis(graph, helpers, outputFrame) {
  const app = (typeof global !== 'undefined' ? global.app : window.app);

  const conversion = app.imports.helpers.conversion;

  const notesToSeconds = conversion.notesToSeconds;
  const positionDeltaToSeconds = conversion.positionDeltaToSeconds;

  const amplitudeToDB = conversion.amplitudeToDB;
  const dBToAmplitude = conversion.dBToAmplitude;

  const Clipper = app.imports.helpers.Clipper;
  const Hysteresis = app.imports.helpers.Hysteresis;
  const Scaler = app.imports.helpers.Scaler;

  // change dynamics for these channels only
  const activeChannels = new Set([
    'score',
  ]);

  // declare with default values
  const parametersPublic = {
    gestureControlsIntensity: false,

    gestureIntensityInputMediumRelative: 0.5, // relative to inputMax 0.5
    gestureIntensityInputMax: 0.3, // 0.4 for more energy 0.3
    gestureIntensityNormalisedMedium: 0.75, // gentle compression 0.75

    metronomeDynamicBoostMin: -40, // MIDI intensity -40
    metronomeDynamicBoostMax: 20, // MIDI intensity 20

    scoreIntensityCompressionMax: 120, // keep some headroom 120
    scoreIntensityCompressionMinFixed: 90, // 90 
    scoreIntensityCompressionMinGesture: 110, // flatter 110
    // 'auto' uses 'gesture' when 'gestureControlsIntensity' is true, or 'default'
    scoreIntensityCompressionMode:'auto', // 'off', 'fixed', 'gesture'
  };

  const parametersPrivate = {
    gestureIntensityInputMin: 0,
    gestureIntensityInputMedium: parametersPublic.gestureIntensityInputMediumRelative
      * parametersPublic.gestureIntensityInputMediumMax,

    gestureIntensityNormalisedLow: 0,
    gestureIntensityNormalisedHigh: 1,
  };

  const parameters = {
    ...parametersPublic,
    ...parametersPrivate,
  };

  let inputSamplePeriod = 0.02; // seconds

  let intensityScale = 1;

  const gestureIntensityToNormalisedLow = new Scaler({
    inputStart: parameters.gestureIntensityInputMin,
    inputEnd: parameters.gestureIntensityInputMedium,
    outputStart: parameters.gestureIntensityNormalisedLow,
    outputEnd: parameters.gestureIntensityNormalisedMedium,
    type: 'linear',
    clip: true,
  });

  // input: use intensityScale for hysteresis smoother
  // output: MIDI intensity boost in [0,127]
  const intensityScaleToMetronomeDynamicBoost = new Scaler({
    inputStart: parameters.gestureIntensityNormalisedLow,
    inputEnd: parameters.gestureIntensityNormalisedHigh,
    outputStart: parameters.metronomeDynamicBoostMin,
    outputEnd: parameters.metronomeDynamicBoostMax,
    type: 'linear',
    clip: true,
  });

  const gestureIntensityToNormalisedHigh = new Scaler({
    inputStart: parameters.gestureIntensityInputMedium,
    inputEnd: parameters.gestureIntensityInputMax,
    outputStart: parameters.gestureIntensityNormalisedMedium,
    outputEnd: parameters.gestureIntensityNormalisedHigh,
    type: 'linear',
    clip: true,
  });

  // clip before hysteresis for better reactivity on saturation
  const gestureIntensityClipper = new Clipper({
    min: parameters.gestureIntensityInputMin,
    max: parameters.gestureIntensityInputMax,
  });

  const lowpassPositionDeltaDown = {
    bar: 0.75, //0.5
    beat: 0,
  }; // 1 bar to go down

  const gestureIntensitySmoother = new Hysteresis({
    sampleRate: 1 / inputSamplePeriod, // update later
    lowpassFrequencyUp: 100, // Hz: 180 bpm
    lowpassFrequencyDown: 1 / positionDeltaToSeconds(lowpassPositionDeltaDown, {
      tempo: 60, // bpm, will update later
      timeSignature: {
        count: 4,
        division: 4,
      },
    }),
  });

  // when gesture controls intensity, limit intensity range of score
  const noteIntensityCompressor = new Scaler({
    inputStart: parameters.noteIntensityCompressedMin,
    inputEnd: parameters.noteIntensityCompressedMax,
    outputStart: parameters.noteIntensityCompressedMin,
    outputEnd: parameters.noteIntensityCompressedMax,
    type: 'linear',
    clip: true,
  });

  // conform to MIDI intensity
  const noteIntensityClipper = new Clipper({
    min: 0,
    max: 127,
  });

  ////// debug
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

  const updateParams = (updates) => {
    if(typeof updates.scoreData !== 'undefined') {
      let noteIntensityMin = (updates.scoreData
                              && updates.scoreData.metas
                              && updates.scoreData.metas.noteIntensityMin
                              ? updates.scoreData.metas.noteIntensityMin
                              : parameters.noteIntensityCompressedMin);

      let noteIntensityMax = (updates.scoreData
                              && updates.scoreData.metas
                              && updates.scoreData.metas.noteIntensityMax
                              ? updates.scoreData.metas.noteIntensityMax
                              : parameters.noteIntensityCompressedMax);

      noteIntensityCompressor.set({
        inputStart: noteIntensityMin,
        inputEnd: noteIntensityMax,
      });
    }

    for(const p of Object.keys(updates) ) {
      if(parameters.hasOwnProperty(p) ) {
        parameters[p] = updates[p];
      }
    }

    if(typeof updates.gestureIntensityInputMediumRelative !== 'undefined') {
      parameters.gestureIntensityInputMedium
        = parameters.gestureIntensityInputMax * parameters.gestureIntensityInputMediumRelative;
    }

    const gestureIntensityToNormalisedLowUpdate
          = typeof updates.gestureIntensityInputMediumRelative !== 'undefined'
          || typeof updates.gestureIntensityNormalisedMedium !== 'undefined';
    if(gestureIntensityToNormalisedLowUpdate) {
      gestureIntensityToNormalisedLow.set({
        inputEnd: parameters.gestureIntensityInputMedium,
        outputEnd: parameters.gestureIntensityNormalisedMedium,
      });
    }

    const gestureIntensityToNormalisedHighUpdate
          = typeof updates.gestureIntensityInputMediumRelative !== 'undefined'
          || typeof updates.gestureIntensityInputMax !== 'undefined'
          || typeof updates.gestureIntensityNormalisedMedium !== 'undefined';
    if(gestureIntensityToNormalisedLowUpdate) {
      gestureIntensityToNormalisedHigh.set({
        inputStart: parameters.gestureIntensityInputMedium,
        inputEnd: parameters.gestureIntensityInputMax,
        outputStart: parameters.gestureIntensityNormalisedMedium,
      });
    }

    const noteIntensityCompressorOutputUpdate
          = typeof updates.scoreIntensityCompressionMode !== 'undefined'
          || typeof updates.gestureControlsIntensity !== 'undefined'
          || typeof updates.scoreIntensityCompressionMax !== 'undefined'
          || typeof updates.scoreIntensityCompressionMinFixed !== 'undefined'
          || typeof updates.scoreIntensityCompressionMinGesture !== 'undefined';
    if(noteIntensityCompressorOutputUpdate) {
      let outputStart;
      if(parameters.gestureControlsIntensity
         && (parameters.scoreIntensityCompressionMode === 'auto'
             || parameters.scoreIntensityCompressionMode === 'gesture') ) {
        outputStart = parameters.scoreIntensityCompressionMinGesture;
      } else {
        outputStart = parameters.scoreIntensityCompressionMinFixed;
      }

      const outputEnd = parameters.scoreIntensityCompressionMax;
      noteIntensityCompressor.set({outputStart, outputEnd});
    }

  };

  ///// Events and data (defined only in browser)
  const registeredEvents = [];
  if(app.events && app.state) {
    [
      ...Object.keys(parametersPublic),
      'scoreData',
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

  return {
    updateParams,

    process(inputFrame, outputFrame) {
      const inputData = app.data;
      const outputData = app.data;

      const time = inputData['time'];
      const now = time.audio;
      const timeSignature = inputData['timeSignature'];
      const tempo = inputData['tempo'];
      const position = inputData['position'];

      const sensorsIntensity = inputData['intensity'].compressed;
      // clip before hysteresis for better reactivity on saturation
      const gestureIntensity
            = gestureIntensityClipper.process(sensorsIntensity);

      if(inputSamplePeriod !== inputData.metas.period) {
        inputSamplePeriod = input.metas.period;
        gestureIntensitySmoother.set({
          sampleRate: 1 / inputSamplePeriod,
        });
      }

      const lowpassFrequencyDown =
            1 / positionDeltaToSeconds(lowpassPositionDeltaDown, {
              tempo,
              timeSignature,
            });

      gestureIntensitySmoother.set({lowpassFrequencyDown});


      const gestureIntensitySmoothed
            = gestureIntensitySmoother.process(gestureIntensity);

      if(gestureIntensitySmoothed < parameters.gestureIntensityInputMedium) {
        intensityScale
          = gestureIntensityToNormalisedLow.process(gestureIntensitySmoothed);
      } else {
        intensityScale
          = gestureIntensityToNormalisedHigh.process(gestureIntensitySmoothed);
      }

      // console.log('sensorsIntensity',
      //             (Math.round(100 * gestureIntensitySmoothed) * 0.01).toFixed(3),
      //             barGraph(gestureIntensitySmoothed, {
      //               peak: sensorsIntensity,
      //               valueMin: 0,
      //               valueMax: parameters.gestureIntensityInputMax,
      //               segmentCharacter: '-',
      //               segmentCharacterPeak: 'X',
      //             }) );

      // console.log('  intensityScale',
      //             (Math.round(100 * intensityScale) * 0.01).toFixed(3),
      //             barGraph(gestureIntensitySmoothed / parameters.gestureIntensityInputMax, {
      //               peak: intensityScale,
      //               valueMin: 0,
      //               valueMax: 1,
      //               segmentCharacter: '.',
      //               segmentCharacterPeak: '|',
      //             }) );


      const eventsContainer = inputData['events'];

      // compress note intensity
      const noteIntensityCompression =
            parameters.scoreIntensityCompressionMode === 'auto'
            || parameters.scoreIntensityCompressionMode === 'fixed'
            || (parameters.scoreIntensityCompressionMode === 'gesture'
                && parameters.gestureControlsIntensity);
      if(noteIntensityCompression && eventsContainer) {
        for(const [part, events] of Object.entries(eventsContainer) ) {
          events.forEach( (event) => {
            if(event.type === 'noteOn') {
              event.data.intensity = noteIntensityCompressor.process(event.data.intensity);
            }
          });
        };
      }

      // apply gesture intensity
      if(parameters.gestureControlsIntensity && eventsContainer) {
        for(const [part, events] of Object.entries(eventsContainer) ) {
          events.forEach( (event) => {
            if(event.type === 'noteOn') {
              event.data.intensity *= intensityScale;
            }
          });
        };
      }

      // clip
      if(eventsContainer) {
        for(const [part, events] of Object.entries(eventsContainer) ) {
          events.forEach( (event) => {
            if(event.type === 'noteOn') {
              event.data.intensity = noteIntensityClipper.process(event.data.intensity);
            }
         });
        };
      }

      // be sure to replicate the output of score, as this node is a filter

      const notesContainer = inputData['notes'];
      if(parameters.gestureControlsIntensity && notesContainer && notesContainer['metronome']) {
        const metronomeNotes = notesContainer['metronome'];
        metronomeNotes.forEach( (note) => {
          const intensityBoost = intensityScaleToMetronomeDynamicBoost.process(
            intensityScale);
          note.intensity = noteIntensityClipper.process(
            note.intensity + intensityBoost);
        });
      }
      outputData['notes'] = notesContainer;

      // console.log("inputData['notes'] = ", inputData['notes']);
      outputData['events'] = eventsContainer;
      outputData['score'] = inputData['score']; // not needed any more

      return outputFrame;
    },

    destroy() {
      registeredEvents.forEach( ([event, callback]) => {
        app.events.removeListener(event, callback);
      });
    },

  };
}