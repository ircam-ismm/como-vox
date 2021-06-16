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

  let inputSamplePeriod = 0.02; // seconds

  let intensityScale = 1;

  const gestureIntensityMin = 0;
  const gestureIntensityMedium = 0.250;
  const gestureIntensityMax = 0.5;

  // normalised intensity
  const intensityRangeLowDefault = 0;
  const intensityRangeMediumDefault = 1;
  const intensityRangeHighDefault = 2;

  const noteIntensityCompressedMinDefault = 50;
  const noteIntensityCompressedMaxDefault = 80;

  const gestureToIntensityLow = new Scaler({
    inputStart: gestureIntensityMin,
    inputEnd: gestureIntensityMedium,
    outputStart: intensityRangeLowDefault,
    outputEnd: intensityRangeMediumDefault,
    type: 'linear',
    clip: true,
  });

  const gestureToIntensityHigh = new Scaler({
    inputStart: gestureIntensityMedium,
    inputEnd: gestureIntensityMax,
    outputStart: intensityRangeMediumDefault,
    outputEnd: intensityRangeHighDefault,
    type: 'linear',
    clip: true,
  });

  // clip before hysteresis for better reactivity on saturation
  const gestureIntensityClipper = new Clipper({
    min: gestureIntensityMin,
    max: gestureIntensityMax,
  });

  const lowpassPositionDeltaDown = {
    bar: 1,
    beat: 0,
  }; // 1 bar to go down

  const gestureIntensitySmoother = new Hysteresis({
    sampleRate: 1 / inputSamplePeriod, // update later
    lowpassFrequencyUp: 10, // Hz: 180 bpm
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
    inputStart: noteIntensityCompressedMinDefault,
    inputEnd: noteIntensityCompressedMaxDefault,
    outputStart: noteIntensityCompressedMinDefault,
    outputEnd: noteIntensityCompressedMaxDefault,
    type: 'linear',
    clip: true,
  });

  // conform to MIDI intensity
  const noteIntensityClipper = new Clipper({
    min: 0,
    max: 127,
  });

  const parameters = {
    gestureControlsIntensity: false,
    scaleRangeLow: intensityRangeLowDefault, // normalised intensity
    scaleRangeHigh: intensityRangeHighDefault, // normalised intensity
  };

  const updateParams = (updates) => {
    if(typeof updates.scaleRangeLow !== 'undefined') {
      gestureToIntensityLow.set({
        outputStart: dBToAmplitude(updates.scaleRangeLow),
      });
    }

    if(typeof updates.scaleRangeHigh !== 'undefined') {
      gestureToIntensityHigh.set({
        outputEnd: dBToAmplitude(updates.scaleRangeHigh),
      });
    }

    if(typeof updates.scoreData !== 'undefined') {
      let noteIntensityMin = (updates.scoreData
                              && updates.scoreData.metas
                              && updates.scoreData.metas.noteIntensityMin
                              ? updates.scoreData.metas.noteIntensityMin
                              : noteIntensityCompressedMinDefault);

      let noteIntensityMax = (updates.scoreData
                              && updates.scoreData.metas
                              && updates.scoreData.metas.noteIntensityMax
                              ? updates.scoreData.metas.noteIntensityMax
                              : noteIntensityCompressedMaxDefault);

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
  };

  ///// Events and data (defined only in browser)
  const registeredEvents = [];
  if(app.events && app.state) {
    [
      'gestureControlsIntensity',
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

      if(gestureIntensitySmoothed < gestureIntensityMedium) {
        intensityScale
          = gestureToIntensityLow.process(gestureIntensitySmoothed);
      } else {
        intensityScale
          = gestureToIntensityHigh.process(gestureIntensitySmoothed);
      }

      // console.log('sensorsIntensity',
      //             (Math.round(100 * sensorsIntensity) * 0.01).toFixed(3),
      //             barGraph(sensorsIntensity, {
      //               peak: gestureIntensitySmoothed,
      //               valueMin: 0,
      //               valueMax: gestureIntensityMax,
      //               segmentCharacter: '-'}) );

      // change intensity of noteOn event from score
      const eventsContainer = inputData['events'];
      if(parameters.gestureControlsIntensity && eventsContainer) {
        for(const [part, events] of Object.entries(eventsContainer) ) {
          events.forEach( (event) => {
            if(event.type === 'noteOn') {
              const intensityCompressed
                    = noteIntensityCompressor.process(event.data.intensity);

              event.data.intensity = noteIntensityClipper.process(
                intensityCompressed * intensityScale);
            }
          });
        };
      }

      // notes for clickSynth from clickGenerator clackFromBeat
      const notesContainer = inputData['notes'];
      if(parameters.gestureControlsIntensity && notesContainer) {
        for(const channel of Object.keys(notesContainer) ) {
          if(!activeChannels.has(channel) ) {
            continue;
          }
          const notes = notesContainer[channel];
          notes.forEach( (note) => {
            note.intensity = noteIntensityClipper.process(
              note.intensity * intensityScale);
          });
        };
      }

      // be sure to replicate the output of score, as this node is a filter
      outputData['notes'] = notesContainer;
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