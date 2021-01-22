function transport(graph, helpers, outputFrame) {
  const app = (typeof global !== 'undefined' ? global.app : window.app);

  const conversion = app.imports.helpers.conversion;
  const secondsToBeats = conversion.secondsToBeats;
  const positionAddBeats = conversion.positionAddBeats;
  const positionDeltaToSeconds = conversion.positionDeltaToSeconds;
  const positionsToBeatsDelta = conversion.positionsToBeatsDelta;
  const positionRoundBeats = conversion.positionRoundBeats;
  const timeDeltaToTempo = conversion.timeDeltaToTempo;

  const math = app.imports.helpers.math;
  const modulo = math.modulo;
  const median = math.median;
  const mean = math.mean;
  const weightedMean = math.weightedMean;

  const time = app.imports.helpers.time;
  const getTime = time.getTime;

  const Scaler = app.imports.helpers.Scaler;

  const tempoDefault = 80;
  const timeSignatureDefault = {
    count: 4,
    division: 4,
  };

  const parameters = {
    timeSignature: timeSignatureDefault,
    playback: true,
    gestureControlsBeatOffset: false,
    gestureControlsTempo: false,
    // 1 bar + 1 beat to get 4 periods for tempo
    // + 1 bar for the gestures fluctuations
    gestureWindow: {
      bar: 1,
      beat: 1,
    },
    tempoLimits: {
      absoluteMin: 40,
      absoluteMax: 200,
      relativeMin: 0,
      relativeMax: 10,
    }
  };

  let positionLast = {
    bar: 1,
    beat: 1,
  };
  let positionWithOffsetLast = positionLast;
  let positionLastTime = 0; // in seconds

  // for tempo and beat offset
  let beatGestures = [];

  // do we need tempo smoother?
  const tempoSmoothDuration = {bar: 0, beat: 0};
  // initialisation with fixed value
  const tempoSmoother = new Scaler({
    inputStart: 0,
    inputEnd: 0,
    outputStart: tempoDefault,
    outputEnd: tempoDefault,
    type: 'linear',
    clip: true,
  });

  const beatOffsetSmoothDuration = {bar: 0, beat: 2};
  // initialisation with fixed value
  const beatOffsetSmoother = new Scaler({
    inputStart: 0,
    inputEnd: 0,
    outputStart: 0,
    outputEnd: 0,
    type: 'linear',
    clip: true,
  });

  // half a beat before and half a beat after
  const beatOffsetRange = 1;
  const beatOffsetRangeInverse = 1 / beatOffsetRange;

  // triangle window    :
  //                    X  1
  //                   /:\
  //                  / : \
  //                 /  :  \
  //                /   :   \
  //               /    :    \
  //   -----------X···········X------------>
  //         -range/2   :   range/2
  //
  const beatOffsetGestureWeigthGet = (offset) => {
    // // too few correction with this window
    // return 1;

    const offsetBounded = Math.max(Math.min(offset,
                                           beatOffsetRange * 0.5),
                                   -beatOffsetRange * 0.5);
    return 1 - Math.abs(offsetBounded) * 2 * beatOffsetRangeInverse;
  }

  const seekPosition = (position) => {
    positionLast = position;
    positionWithOffsetLast = position;
    positionLastTime = 0;

    beatGestures.length = 0;
    tempoSmoother.set({
      inputStart: 0,
      inputEnd: 0,
      // end now
      outputStart: tempoSmoother.outputEnd,
    });

    beatOffsetSmoother.set({
      inputStart: 0,
      inputEnd: 0,
      outputStart: 0,
      outputEnd: 0,
    });

  }

  const setTimeSignature = (timeSignature) => {
    parameters.timeSignature = timeSignature;
    beatGestures.length = 0;
  }

  return {
    updateParams(updates) {
      if(typeof updates.seekPosition !== 'undefined') {
        seekPosition(updates.seekPosition);
      }

      if(typeof updates.timeSignature !== 'undefined') {
        setTimeSignature(updates.timeSignature);
      }

      if(typeof updates.tempo !== 'undefined') {
        // immediately set fixed value
        tempoSmoother.set({
          inputStart: 0,
          inputEnd: 0,
          outputStart: updates.tempo,
          outputEnd: updates.tempo,
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
      // use logical time tag from frame
      const now = inputData['time'];

      const tempo = tempoSmoother.process(now);
      const beatOffset = beatOffsetSmoother.process(now);

      const timeSignature = parameters.timeSignature;

      // do not alias playback as it may change

      outputData['timeSignature'] = timeSignature;
      outputData['playback'] = parameters.playback;

      // start
      if(!parameters.playback || positionLastTime === 0) {
        outputData['tempo'] = tempo;
        outputData['position'] = positionLast;

        positionLastTime = now;
        return outputFrame;
      }

      const timeDelta = now - positionLastTime;
      const beatDelta = secondsToBeats(timeDelta, {tempo, timeSignature});

      let position = positionAddBeats(positionLast, beatDelta, {timeSignature});
      let positionWithOffset = positionAddBeats(position, beatOffset, {timeSignature});

      if(positionsToBeatsDelta(positionWithOffset,
                               positionWithOffsetLast,
                               {timeSignature}) < 0) {
        // do not go back in time, to ensure monotonic output
        positionWithOffset = positionWithOffsetLast;
      }

      const beatGesture = inputData['beat'];
      ////////////// beat gestures for tempo and beat offset
      if( (parameters.gestureControlsTempo || parameters.gestureControlsBeatOffset)
          && beatGesture && beatGesture.trigger) {
        const beatGestureDeltaFromNow = secondsToBeats(beatGesture.time - now, {
          timeSignature,
          tempo,
        });
        const beatGesturePosition = positionAddBeats(positionWithOffset,
                                                     beatGestureDeltaFromNow,
                                                     {timeSignature});
        beatGestures.push({
          time: beatGesture.time,
          position: beatGesturePosition
        });

        // maximum number of beats from now
        // and minimum number of tempo gestures
        const deltaMax = parameters.gestureWindow.bar * timeSignature.count
              + parameters.gestureWindow.beat;

        // remove old gestures
        for(let g = 0; g < beatGestures.length; ++g) {
          const gesture = beatGestures[g];
          if(deltaMax < positionsToBeatsDelta(positionWithOffset,
                                              gesture.position,
                                              {timeSignature}) ) {
            beatGestures[g] = undefined;
          }
        }
        beatGestures = beatGestures.filter( (gesture) => {
          return typeof gesture !== 'undefined';
        });
      }

      ////////////////// tempo
      if(parameters.gestureControlsTempo
         && beatGesture && beatGesture.trigger) {
        const {
          absoluteMin,
          absoluteMax,
          relativeMin,
          relativeMax,
        } = parameters.tempoLimits;
        let tempos = [];
        for(let g = beatGestures.length - 1; g > 0; --g) {
          const timeDelta = beatGestures[g].time - beatGestures[g - 1].time;
          const beatDelta
                = positionsToBeatsDelta(beatGestures[g].position,
                                        beatGestures[g - 1].position,
                                        {timeSignature});
          if(beatDelta > 0.5 && beatDelta < 2.5) {
            const tempoFromGesture = timeDeltaToTempo(timeDelta,
                                                  Math.round(beatDelta),
                                                  {timeSignature});
            if(tempoFromGesture > absoluteMin
               && tempoFromGesture < absoluteMax
               && tempoFromGesture > relativeMin * tempo
               && tempoFromGesture < relativeMax * tempo) {
              tempos.push(tempoFromGesture);
            }
          }
        }

        if(tempos.length > 0) {
          // use median(tempos) to avoid outliers, instead of mean
          const tempoNew = median(tempos);
          tempoSmoother.set({
            inputStart: now,
            inputEnd: now + positionDeltaToSeconds(tempoSmoothDuration, {
              tempo: tempoNew,
              timeSignature
            }),
            outputStart: tempo,
            outputEnd: tempoNew
          });
          // now, tempo is still old tempo
        }

      }

      ///////////////////// beat offset
      if(parameters.gestureControlsBeatOffset
         && beatGesture && beatGesture.trigger) {

        let offsets = [];
        let offsetWeights = [];

        for(let g = beatGestures.length - 1; g >= 0; --g) {
          const beatGesturePosition = beatGestures[g].position;
          const beatDelta = positionsToBeatsDelta(positionWithOffset,
                                                  beatGestures[g].position,
                                                  {timeSignature});
          // consider only one bar from now,
          // plus and one beat for the fluctuations
          if(beatDelta > timeSignature.count + 1) {
            break;
          }

          const beatGesturePositionRounded
                = positionRoundBeats(beatGesturePosition, {timeSignature});
          const offset = positionsToBeatsDelta(beatGesturePosition,
                                               beatGesturePositionRounded,
                                               {timeSignature});

          offsets.push(offset);
          const offsetWeight = beatOffsetGestureWeigthGet(offset);
          offsetWeights.push(offsetWeight);
        }

        if(offsets.length > 0) {
          const beatOffsetNew = weightedMean(offsets, offsetWeights);
          beatOffsetSmoother.set({
            inputStart: now,
            inputEnd: now + positionDeltaToSeconds(beatOffsetSmoothDuration, {
              tempo,
              timeSignature,
            }),
            outputStart: beatOffset,
            outputEnd: beatOffsetNew,
          });
        }
      }

      outputData['tempo'] = tempo;

      outputData['position'] = positionWithOffset;
      positionLast = position;
      positionWithOffsetLast = positionWithOffset;
      positionLastTime = now;

      return outputFrame;
    },
    destroy() {

    },
  };
}