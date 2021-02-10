function transport(graph, helpers, outputFrame) {
  const app = (typeof global !== 'undefined' ? global.app : window.app);

  const conversion = app.imports.helpers.conversion;
  const notesToSeconds = conversion.notesToSeconds;
  const secondsToBeats = conversion.secondsToBeats;
  const positionAddBeats = conversion.positionAddBeats;
  const positionDeltaToSeconds = conversion.positionDeltaToSeconds;
  const positionsToBeatsDelta = conversion.positionsToBeatsDelta;
  const positionsToSecondsDelta = conversion.positionsToSecondsDelta;
  const positionRoundBeats = conversion.positionRoundBeats;
  const timeDeltaToTempo = conversion.timeDeltaToTempo;

  const math = app.imports.helpers.math;
  const modulo = math.modulo;
  const median = math.median;
  const mean = math.mean;
  const weightedMean = math.weightedMean;

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
      relativeMin: 0, // no relative min
      relativeMax: 10, //  no relative max
    }
  };

  let positionLast = {
    bar: 1,
    beat: 1,
  };
  let positionWithOffsetLast = positionLast;
  let positionLastTime = {
    audio: 0,
    local: 0,
  };
  let beatChangedLastTime = {
    audio: 0,
    local: 0,
  }; // local time

  // for tempo and beat offset
  let beatGestures = [];

  // do we need tempo smoother?
  const tempoSmoothDuration = 0.25; // quarter note
  // initialisation with fixed value
  const tempoSmoother = new Scaler({
    inputStart: 0,
    inputEnd: 0,
    outputStart: tempoDefault,
    outputEnd: tempoDefault,
    type: 'linear',
    clip: true,
  });

  const beatOffsetSmoothDuration = 1; // whole note{bar: 1, beat: 0};
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
  //                    X 1
  //                   /:\
  //                  / : \
  //                 /  :  \
  //                /   :   \
  //               /    : 0  \
  //   -----------X···········X------------>
  //         -range/2   :   range/2
  //
  // allows to minimise the contribution of out of phase samples,
  // and to stabilise around 0
  const beatOffsetGestureWeigthGet = (offset) => {
    const offsetBounded = Math.max(Math.min(offset,
                                           beatOffsetRange * 0.5),
                                   -beatOffsetRange * 0.5);
    return 1 - Math.abs(offsetBounded) * 2 * beatOffsetRangeInverse;
  }

  const seekPosition = (position) => {
    positionLast = position;
    positionWithOffsetLast = position;
    positionLastTime = {
      audio: 0,
      local: 0,
    };

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
      // - now.audio for eveything related to position
      // - now.local for beat from gestures
      const now = inputData['time'];

      const tempo = tempoSmoother.process(now.audio);
      const beatOffset = beatOffsetSmoother.process(now.audio);

      const timeSignature = parameters.timeSignature;

      // do not alias playback as it may change

      outputData['timeSignature'] = timeSignature;
      outputData['playback'] = parameters.playback;

      // stop
      if(!parameters.playback) {
        outputData['tempo'] = tempo;
        app.data.tempo = tempo;

        const outputPosition = {
          bar: positionLast.bar,
          beat: positionLast.beat,
          barChanged: false,
          beatChanged: false
        };
        outputData['position'] = outputPosition
        app.data.position = outputPosition;

        // pause
        if(positionLastTime.audio !== 0) {
          positionLastTime = {
            audio: now.audio,
            local: now.local,
          };
        }

        return outputFrame;
      }

      const timeDelta = (positionLastTime.audio !== 0
                         ? now.audio - positionLastTime.audio
                         : 0);
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

      // // debug only
      // if(beatGesture && beatGesture.trigger) {
      //   const timeDeltaFromPlayback = beatChangedLastTime.local
      //         - (beatGesture.time - app.data.playbackLatency);
      //   const beatDeltaFromPlaback = secondsToBeats(
      //     timeDeltaFromPlayback,
      //     {timeSignature, tempo});
      //   console.log('beat',
      //               beatGesture.time,
      //               now.local,
      //               timeDeltaFromPlayback,
      //               beatDeltaFromPlaback);
      // }

      ////////////// beat gestures for tempo and beat offset
      if( (parameters.gestureControlsTempo
           || parameters.gestureControlsBeatOffset)
          && beatGesture && beatGesture.trigger) {

        // time related to scheduled audio
        beatGestures.push({
          time: beatGesture.time - app.data.playbackLatency,
        });

        // maximum number of beats from last beat (local time)
        // and minimum number of tempo gestures
        const beatDeltaMax = parameters.gestureWindow.bar * timeSignature.count
              + parameters.gestureWindow.beat;

        // remove old gestures
        for(let g = 0; g < beatGestures.length; ++g) {
          const beatGesture = beatGestures[g];
          const beatDeltaFromPlayback = secondsToBeats(
            beatChangedLastTime.local - beatGesture.time,
            {timeSignature, tempo});

          if(beatDeltaMax < beatDeltaFromPlayback) {
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
        let beatDeltas = [];
        for(let g = beatGestures.length - 1; g > 0; --g) {
          const timeDelta = beatGestures[g].time - beatGestures[g - 1].time;
          const beatDelta = secondsToBeats(timeDelta, {tempo, timeSignature});

          if(beatDelta > 0.5 && beatDelta < 2.5) {
            const beatDeltaRounded = Math.round(beatDelta);
            const tempoFromGesture = timeDeltaToTempo(timeDelta,
                                                  beatDeltaRounded,
                                                  {timeSignature});
            if(tempoFromGesture > absoluteMin
               && tempoFromGesture < absoluteMax
               && tempoFromGesture > relativeMin * tempo
               && tempoFromGesture < relativeMax * tempo) {
              tempos.push(tempoFromGesture);
              beatDeltas.push(beatDeltaRounded);
            }
          }
        }

        // first period may be wrong,
        // specially when starting the last beat of a bar
        // use at least 2 samples to smooth variations
        // warning: with 2 samples, mean of 2 intermediate values is used
        if(tempos.length >= 2) {
          // - use median(tempos) to avoid outliers, instead of mean
          // - use median(beatDeltas) to halve tempo
          //   (with transition with mean on middle values)

          const tempoNew = median(tempos) / Math.floor(median(beatDeltas) );

          // console.log('tempoSmoothDuration',
          //             notesToSeconds(tempoSmoothDuration, {
          //               tempo: tempoNew,
          //             }) );

          tempoSmoother.set({
            inputStart: now.audio,
            inputEnd: now.audio + notesToSeconds(tempoSmoothDuration, {
              tempo: tempoNew,
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
          const beatGesture = beatGestures[g];
          // time related to scheduled audio output
          const beatDeltaFromPlayback = secondsToBeats(
            beatChangedLastTime.local - beatGesture.time,
            {timeSignature, tempo});

          // consider only one bar from now,
          // plus and one beat for the fluctuations
          if(beatDeltaFromPlayback > timeSignature.count + 1) {
            break;
          }

          // Compute new beat offset as a relative phase:
          // - Use position with beat offset, as it is the current reference,
          //   which is heard.
          // - It allows to apply a window centred around zero.
          // The new offset as a relative offset, and must be added to the
          // current one.
          const beatGesturePosition = positionAddBeats(positionWithOffset,
                                                       beatDeltaFromPlayback,
                                                       {timeSignature});

          const beatGesturePositionRounded
                = positionRoundBeats(beatGesturePosition, {timeSignature});
          const offset = positionsToBeatsDelta(beatGesturePosition,
                                               beatGesturePositionRounded,
                                               {timeSignature});

          offsets.push(offset);
          const offsetWeight = beatOffsetGestureWeigthGet(offset);
          offsetWeights.push(offsetWeight);
        }

        // First period may be wrong, specially when starting the last beat of
        // a bar: use at least 2 samples to smooth variations.
        if(offsets.length >= 2) {
          // console.log('beatOffsetSmoothDuration',
          //             notesToSeconds(beatOffsetSmoothDuration, {
          //               tempo,
          //             }));

          const beatOffsetNew = weightedMean(offsets, offsetWeights);
          beatOffsetSmoother.set({
            inputStart: now.audio,
            inputEnd: now.audio + notesToSeconds(beatOffsetSmoothDuration, {
              tempo,
            }),
            OutputStart: beatOffset,
            // new offset is relative
            outputEnd: beatOffset + beatOffsetNew,
          });
        }
      }

      outputData['tempo'] = tempo;
      app.data.tempo = tempo;

      let barChanged = false;
      let beatChanged = false;

      const barLast = positionWithOffsetLast.bar;
      const beatLast = positionWithOffsetLast.beat;

      const bar = positionWithOffset.bar;
      const beat = positionWithOffset.beat;
      if(positionLastTime.audio === 0) {
        // start
        barChanged = true;
        beatChanged = true;
      } else {
        barChanged = bar !== barLast;
        // on beat change
        beatChanged = (Math.floor(beat) !== Math.floor(beatLast)
                       || barChanged); // count to 1
      }

      if(beatChanged) {
        const beatChangedPreviousTime = beatChangedLastTime;

        const bar = positionWithOffset.bar;
        const beat = positionWithOffset.beat;

        const positionWithOffsetRounded = {
          bar,
          beat: Math.floor(beat),
        };

        const beatChangeLastTimeOffset = positionsToSecondsDelta(
          positionWithOffsetRounded, positionWithOffset, {
            timeSignature,
            tempo,
          });

        beatChangedLastTime = {
          local: now.local + beatChangeLastTimeOffset,
          audio: now.audio + beatChangeLastTimeOffset,
        };

        // // for debug only
        // const audioContext = graph.como.audioContext;
        // const localToAudioContextTime = app.imports.helpers.time.localToAudioContextTime;
        // console.log("beatChangedLastTime = ",
        //             'local',
        //             beatChangedLastTime.local,
        //             beatChangedLastTime.local - beatChangedPreviousTime.local,
        //             'audio',
        //             beatChangedLastTime.audio,
        //             beatChangedLastTime.audio - beatChangedPreviousTime.audio,
        //             'local - audio',
        //             localToAudioContextTime(beatChangedLastTime.local, {audioContext})
        //             - beatChangedLastTime.audio,
        //            );
      }

      const outputPosition = {
        bar: positionWithOffset.bar,
        beat: positionWithOffset.beat,
        barChanged,
        beatChanged,
      };
      outputData['position'] = outputPosition;
      app.data.position = outputPosition;

      positionLast = position;
      positionWithOffsetLast = positionWithOffset;
      positionLastTime = {
        audio: now.audio,
        local: now.local,
      };

      return outputFrame;
    },
    destroy() {

    },
  };
}