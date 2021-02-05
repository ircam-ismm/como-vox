function intensityFromGesture(graph, helpers, outputFrame) {
  const app = (typeof global !== 'undefined' ? global.app : window.app);

  const conversion = app.imports.helpers.conversion;
  const amplitudeToDB = conversion.amplitudeToDB;
  const dBToAmplitude = conversion.dBToAmplitude;

  const Scaler = app.imports.helpers.Scaler;
  const Clipper = app.imports.helpers.Clipper;


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

    if(segmentActiveCount === 0) {
      return segmentCharacterZero;
    }

    let segments = new Array(segmentCount).fill(' ');
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

  let gestureIntensityNext = -Infinity; // current maximum

  let intensityScaleCurrent = 1;
  let intensityScaleUpdate = false; // trigger on beat or on gesture

  const gestureIntensityMin = 0;
  const gestureIntensityMedium = 0.250;
  const gestureIntensityMax = 0.5;

  // normalised intensity
  const intensityRangeLowDefault = 0;
  const intensityRangeMediumDefault = 1;
  const intensityRangeHighDefault = 2;

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

  return {
    updateParams(updates) {
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

      for(const p of Object.keys(updates) ) {
        if(parameters.hasOwnProperty(p) ) {
          parameters[p] = updates[p];
        }
      }
    },

    process(inputFrame, outputFrame) {
      const inputData = inputFrame.data;
      const outputData = outputFrame.data;

      const timeSignature = inputData['timeSignature'];
      const tempo = inputData['tempo'];
      const position = inputData['position'];

      const intensityScaleUpdate = position.beatChanged;

      const sensorsIntensity = inputData['intensity'];

      gestureIntensityNext = Math.max(gestureIntensityNext,
                                      sensorsIntensity.compressed);

      // const gestureBeat = inputData['beat'];
      // if(gestureBeat && gestureBeat.trigger
      //    && typeof gestureBeat.intensity !== 'undefined') {
      //   console.log("****** beat = ", {...gestureBeat}, gestureBeat.intensity);
      // }

      // console.log('gestureBeat.mean',
      //             (Math.round(100 * gestureBeat.mean) * 0.01).toFixed(3),
      //             barGraph(gestureBeat.mean, {
      //               valueMin: 0,
      //               valueMax: 200,
      //               segmentCharacter: '-'}) );

      // console.log('gestureBeat.std',
      //             (Math.round(100 * gestureBeat.std) * 0.01).toFixed(3),
      //             barGraph(gestureBeat.std, {
      //               valueMin: 0,
      //               valueMax: 100,
      //               segmentCharacter: '-'}) );

      // console.log('sensorsIntensity.linear',
      //             (Math.round(100 * sensorsIntensity.linear) * 0.01).toFixed(3),
      //             meter(sensorsIntensity.linear, {
      //               valueMin: 0,
      //               valueMax: 0.5,
      //               segmentCharacter: '-'}),
      //            );

      // const intensityLinearDB = amplitudeToDB(sensorsIntensity.linear);
      // console.log('sensorsIntensity.linear.toDB',
      //             Math.round(intensityLinearDB).toFixed(0),
      //             barGraph(intensityLinearDB, {
      //               valueMin: -50,
      //               valueMax: 0,
      //               segmentCharacter: '='}),
      //            );

      // we use this one
      // console.log('sensorsIntensity.compressed',
      //             (Math.round(100 * sensorsIntensity.compressed) * 0.01).toFixed(3),
      //             barGraph(sensorsIntensity.compressed, {
      //               peak: gestureIntensityNext,
      //               valueMin: 0,
      //               valueMax: gestureIntensityMax,
      //               segmentCharacter: '-'}) );


      if(intensityScaleUpdate) {
        if(gestureIntensityNext < gestureIntensityMedium) {
          intensityScaleCurrent
            = gestureToIntensityLow.process(gestureIntensityNext);
        } else {
          intensityScaleCurrent
            = gestureToIntensityHigh.process(gestureIntensityNext);
        }
        // console.log("intensityScaleCurrent = ", intensityScaleCurrent,
        //             gestureIntensityNext,
        //             'at position', {...position});

        gestureIntensityNext = -Infinity;
      }

      // change intensity of noteOn event from score
      const eventsContainer = inputData['events'];
      if(parameters.gestureControlsIntensity && eventsContainer) {
        eventsContainer.forEach( (events, part) => {
          events.forEach( (event) => {
            if(event.type === 'noteOn') {
              event.data.intensity = noteIntensityClipper.process(
                event.data.intensity * intensityScaleCurrent);
            }
          });
        });
      }

      // notes for clickSynth from clickGenerator clackFromBeat
      const notesContainer = inputData['notes'];
      if(parameters.gestureControlsIntensity && notesContainer) {
        for(const channel in notesContainer) {
          const notes = notesContainer[channel];
          notes.forEach( (note) => {
            note.intensity = noteIntensityClipper.process(
              note.intensity * intensityScaleCurrent);
          });
        };
      }

      // be sure to replicate the output of score, as this node is a filter
      outputData['notes'] = notesContainer;
      outputData['events'] = eventsContainer;
      outputData['score'] = inputData['score'];

      return outputFrame;
   },

    destroy() {
    },

  };
}