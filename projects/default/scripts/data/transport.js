function transport(graph, helpers, outputFrame) {
  const app = (typeof global !== 'undefined' ? global.app : window.app);

  const conversion = app.imports.helpers.conversion;
  const notesToSeconds = conversion.notesToSeconds;
  const secondsToBeats = conversion.secondsToBeats;
  const beatsToSeconds = conversion.beatsToSeconds;
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
    gestureControlsPlaybackStart: false,
    gestureControlsPlaybackStop: false,
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
      absoluteMax: 180,
      relativeMin: 0, // no relative min
      relativeMax: 10, //  no relative max
    }
  };

  let playbackStartRequest = null;

  let positionStopped = {
    bar: 1,
    beat: 1,
  };
  let positionLast = positionStopped;
  let positionWithOffsetLast = positionLast;

  let positionStoppedTime = {
    audio: 0,
    local: 0,
  };
  let positionLastTime = positionStoppedTime;
  let beatChangeLastTime = positionLastTime;


  // for tempo and beat offset
  let beatGestures = [];
  let beatGestureLastTime = 0; // local time

  let beatChanges = [];
  // keep 2 bars to be able to tag beat gestures in the past
  const beatChangesWindow = {
    bar: 2,
    beat: 0,
  };

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

  const beatOffsetSmoothDuration = 0.25; // half note
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

  const setGestureControlsPlaybackStart = (control) => {
    gestureControlsPlaybackStart = control;
    playbackStartRequest = null;
  };

  const setPlayback = (playback) => {
    if(playback === parameters.playback) {
      return;
    }

    if(playback) {
      playbackStartRequest = null;
      tempoSmoother.set({
        inputStart: 0,
        inputEnd: 0,
        // end now
        outputStart: tempoSmoother.outputEnd,
      });

      beatOffsetSmoother.set({
        inputStart: 0,
        inputEnd: 0,
        outputStart: beatOffsetSmoother.outputEnd,
        outputEnd: 0,
      });
    } else {
      playbackStartRequest = null;
      positionStopped = positionLast;

      beatGestures.length = 0;
      beatGestureLastTime = 0;
      beatChanges.length = 0;
    }
    // reset also stopped time on pause
    positionStoppedTime = app.data['time'];

    app.data['playback'] = playback;
  };

  const seekPosition = (position) => {
    positionStopped = position;
    // keep last positionStoppedTime
    positionLast = position;
    positionWithOffsetLast = position;
    positionLastTime = {
      audio: 0,
      local: 0,
    };

    beatGestures.length = 0;
    beatChanges.length = 0;
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
  }

  const updateParams = (updates) => {
    if(typeof updates.playback !== 'undefined') {
      setPlayback(updates.playback);
    }

    if(typeof updates.gestureControlsTempoPlaybackStart !== 'undefined') {
      setGestureControlsPlaybackStart(updates.gestureControlsPlaybackStart);
    }

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

  };

  ///// Events and data (defined only in browser)
  if(app.events && app.state) {
    [
      'gestureControlsBeatOffset',
      'gestureControlsPlaybackStart',
      'gestureControlsPlaybackStop',
      'gestureControlsTempo',
      'playback',
      'tempo',
      'seekPosition',
      'timeSignature',
    ].forEach( (event) => {
      app.events.on(event, (value) => {
        // compatibility with setGraphOption
        updateParams({[event]: value});
      });
      updateParams({[event]: app.state[event]});
    });
  }

  return {
    updateParams,

    process(inputFrame, outputFrame) {
      const inputData = app.data;
      const outputData = app.data;
      // use logical time tag from frame
      // - now.audio for eveything related to position
      // - now.local for beat from gestures
      const now = inputData['time'];

      const tempo = tempoSmoother.process(now.audio);
      const beatOffset = beatOffsetSmoother.process(now.audio);

      const timeSignature = parameters.timeSignature;

      // do not alias playback as it may change

      outputData['timeSignature'] = timeSignature;

      const playback = inputData['playback'];
      if(playback !== parameters.playback) {
        updateParams({playback});
      }


      if(playbackStartRequest && now.local >= playbackStartRequest.time) {
        const {time, tempo, position, beatOffset} = playbackStartRequest;

        // @TODO: currently not possible to seek instantly
        seekPosition(position);
        // instead, seek to beginning of bar on stop (playerExperience)

        const timeOffsetFromNow = time - now.local;

        positionLastTime = {
          audio: now.audio + timeOffsetFromNow,
          local: now.local + timeOffsetFromNow,
        };

        // immediately set fixed values
        tempoSmoother.set({
          inputStart: 0,
          inputEnd: 0,
          outputStart: tempo,
          outputEnd: tempo,
        });

        beatOffsetSmoother.set({
          inputStart: 0,
          inputEnd: 0,
          outputStart: beatOffset,
          outputEnd: beatOffset,
        });

        app.events.emit('playback', true);
        playbackStartRequest = null;
      }

      outputData['playback'] = parameters.playback;
      // stop
      if(!parameters.playback && !parameters.gestureControlsPlaybackStart) {
        outputData['tempo'] = tempo;
        outputData['tempo'] = tempo;

        const outputPosition = {
          bar: positionStopped.bar,
          beat: positionStopped.beat,
          barChange: false,
          beatChange: false
        };
        outputData['position'] = outputPosition

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
      if(isNaN(positionWithOffset.bar) || isNaN(positionWithOffset.beat) ) {
        debugger;
      }

      if(positionsToBeatsDelta(positionWithOffset,
                               positionWithOffsetLast,
                               {timeSignature}) < 0) {
        // do not go back in time, to ensure monotonic output
        positionWithOffset = positionWithOffsetLast;
      }

      let barChange = false;
      let beatChange = false;

      const barLast = positionWithOffsetLast.bar;
      const beatLast = positionWithOffsetLast.beat;

      const bar = positionWithOffset.bar;
      const beat = positionWithOffset.beat;
      if(playback && positionLastTime.audio === 0) {
        // start
        barChange = true;
        beatChange = true;
      } else {
        barChange = bar !== barLast;
        // on beat change
        beatChange = (Math.floor(beat) !== Math.floor(beatLast)
                       || barChange); // count to 1
      }

      if(beatChange) {
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

        beatChangeLastTime = {
          local: now.local + beatChangeLastTimeOffset,
          audio: now.audio + beatChangeLastTimeOffset,
        };

        beatChanges.push({
          position: positionWithOffset,
          time: beatChangeLastTime,
          tempo,
          timeSignature,
        });

        // maximum number of beats from last beat (local time)
        // and minimum number of beat changes
        const beatDeltaMax = beatChangesWindow.bar * timeSignature.count
              + beatChangesWindow.beat;

        // remove old beat changes
        for(let g = 0; g < beatChanges.length; ++g) {
          const beatChange = beatChanges[g];
          const beatDeltaFromPlayback = secondsToBeats(
            beatChangeLastTime.local - beatChange.time.local,
            {timeSignature, tempo});

          if(beatDeltaMax < beatDeltaFromPlayback) {
            beatChanges[g] = undefined;
          }
        }
        beatChanges = beatChanges.filter( (change) => {
          return typeof change !== 'undefined';
        });
      }

      const beatGesture = inputData['beat'];

      ////////////// beat gestures for tempo and beat offset
      if( (parameters.gestureControlsTempo
           || parameters.gestureControlsBeatOffset
           || parameters.gestureControlsPlaybackStart
           || parameters.gestureControlsPlaybackStop)
          && beatGesture && beatGesture.trigger) {

        let beatChangeClosest;
        for(let c = beatChanges.length - 1; c >= 0; --c) {
          const beatChange = beatChanges[c];
          if(!beatChangeClosest
             || (Math.abs(beatGesture.time - beatChange.time.local)
                 < Math.abs(beatGesture.time - beatChangeClosest.time) ) ) {
            beatChangeClosest = beatChange;
          }

          // next is even further away
          if(beatChange.time.local > beatGesture.time) {
            break;
          }
        }

        // last beat change, or current position
        const beatReference = (beatChangeClosest
                               ? beatChangeClosest
                               : {
                                 position: positionWithOffset,
                                 time: now,
                                 tempo,
                                 timeSignature,
                               });

        // time related to scheduled audio
        beatGestures.push({
          time: beatGesture.time,
          beatReference,
        });
        beatGestureLastTime = beatGesture.time;

        // maximum number of beats from last beat (local time)
        // and minimum number of tempo gestures
        const beatDeltaMax = parameters.gestureWindow.bar * timeSignature.count
              + parameters.gestureWindow.beat;

        // remove old gestures
        for(let g = 0; g < beatGestures.length; ++g) {
          const beatGesture = beatGestures[g];
          const beatDeltaFromPlayback = secondsToBeats(
            beatChangeLastTime.local - beatGesture.time,
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

          tempoSmoother.set({
            inputStart: now.audio,
            inputEnd: now.audio + notesToSeconds(tempoSmoothDuration, {
              tempo: tempoNew,
            }),
            outputStart: tempo,
            outputEnd: tempoNew,
          });
          // now, tempo is still old tempo
        }

      }

      ///////////////////// beat offset
      if(parameters.gestureControlsBeatOffset
         && beatGesture && beatGesture.trigger) {

        const playbackLatency = inputData['playbackLatency'];

        let offsets = [];
        let offsetWeights = [];

        for(let g = beatGestures.length - 1; g >= 0; --g) {
          const beatGesture = beatGestures[g];
          // time related to scheduled audio output:
          // compensate for look-ahead latency
          const beatDeltaFromPlayback = secondsToBeats(
            beatChangeLastTime.local - beatGesture.time - playbackLatency,
            {timeSignature, tempo});

          // consider only one bar from now,
          // plus and one beat for the fluctuations
          if(beatDeltaFromPlayback > timeSignature.count + 1) {
            break;
          }

          const beatReference = beatGesture.beatReference;

          // time related to scheduled audio output:
          // compensate for look-ahead latency
          const beatDeltaFromReference = secondsToBeats(
            beatReference.time.local - beatGesture.time - playbackLatency,
            {
              timeSignature: beatReference.timeSignature,
              tempo: beatReference.tempo,
            });


          // Compute new beat offset as a relative phase from reference:
          // - Use position with beat offset, as it is the current reference,
          //   which is heard.
          // - It allows to apply a window centred around zero.
          // The new offset as a relative offset, and must be added to the
          // current one.
          const beatGesturePosition = positionAddBeats(
            beatReference.position,
            beatDeltaFromReference,
            {
              timeSignature: beatReference.timeSignature,
            });

          const beatGesturePositionRounded
                = positionRoundBeats(beatGesturePosition, {
                  timeSignature: beatReference.timeSignature,
                });
          const offset
                = positionsToBeatsDelta(beatGesturePosition,
                                        beatGesturePositionRounded,
                                        {
                                          timeSignature: beatReference.timeSignature,
                                        });
          if(isNaN(offset) ) {
            debugger;
          }

          offsets.push(offset);
          const offsetWeight = beatOffsetGestureWeigthGet(offset);
          offsetWeights.push(offsetWeight);
        }

        // First period may be wrong, specially when starting the last beat of
        // a bar: use at least 2 samples to smooth variations.
        if(offsets.length >= 2) {
          const beatOffsetNew = weightedMean(offsets, offsetWeights);
          beatOffsetSmoother.set({
            inputStart: now.audio,
            inputEnd: now.audio + notesToSeconds(beatOffsetSmoothDuration, {
              tempo,
            }),
            outputStart: beatOffset,
            // new offset is relative
            outputEnd: beatOffset + beatOffsetNew,
          });
        }
      }

      //////////// auto start
      if(!playback && parameters.gestureControlsPlaybackStart
         && !playbackStartRequest) {
        // wait for 4 beats on 1/4 and 2/4 time signature
        const startAfterBeats = (timeSignature.count < 3
                                 ? 4
                                 : timeSignature.count);

        const beatGesturesStart = [];
        // keep gestures after stop, do not change ordering
        for(let g = 0; g < beatGestures.length; ++g) {
          if(beatGestures[g].time < positionStoppedTime) {
            continue;
          }
          beatGesturesStart.push(beatGestures[g]);
        }

        if(beatGesturesStart.length >= startAfterBeats) {
          ////// tempo
          // @TODO: factorise tempo computation

          const {
            absoluteMin,
            absoluteMax,
            relativeMin,
            relativeMax,
          } = parameters.tempoLimits;
          let tempos = [];
          for(let g = beatGesturesStart.length - 1; g > 0; --g) {
            const timeDelta = beatGesturesStart[g].time - beatGesturesStart[g - 1].time;
            const tempoFromGesture = timeDeltaToTempo(timeDelta,
                                                      1,
                                                      {timeSignature});
            if(tempoFromGesture > absoluteMin
               && tempoFromGesture < absoluteMax
               && tempoFromGesture > relativeMin * tempo
               && tempoFromGesture < relativeMax * tempo) {
              tempos.push(tempoFromGesture);
            }

          }

          // one less because tempos are intervals between gestures
          if(tempos.length >= startAfterBeats - 1) {

            // use mean for stability, instead of median?
            const tempoStart = mean(tempos);

            /////// beat offset
            let offsets = [];
            let offsetWeights = [];

            // includes first one (0 offset sample, for global estimation)
            for(let g = beatGesturesStart.length - 1; g >= 0; --g) {
              // time related to first beat
              const beatDeltaFromStart = secondsToBeats(
                beatGesturesStart[0].time - beatGesturesStart[g].time,
                {
                  timeSignature,
                  tempo: tempoStart,
                });

              // Compute new beat offset as a relative phase:
              // - Use position with beat offset, as it is the current reference,
              //   which is heard.
              // - It allows to apply a window centred around zero.
              // The new offset as a relative offset, and must be added to the
              // current one.
              const beatGesturePosition = positionAddBeats(positionWithOffset,
                                                           beatDeltaFromStart,
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

            const beatOffsetStart = mean(offsets);

            // restart on first beat of current bar
            const positionStart = {
              bar: positionStopped.bar,
              beat: 1,
            };

            // playback on next beat
            // - compensate for audio look-ahead
            // - apply beat offset later, do not compensate

            const lookAheadNotes = app.data.lookAheadNotes;

            // Start time from first beat gesture whose offset is 0
            const timeStart = beatGesturesStart[0].time
                  + positionDeltaToSeconds({bar: 0,
                                            beat: tempos.length + 1,
                                           }, {
                                             tempo: tempoStart,
                                             timeSignature
                                           })
                  - notesToSeconds(lookAheadNotes, {tempo: tempoStart})
                  - beatOffsetStart;

            playbackStartRequest = {
              time: timeStart,
              position: positionStart,
              tempo: tempoStart,
              beatOffset: beatOffsetStart,
            };
          }
        }
      }

      //////////// auto stop
      if(playback && parameters.gestureControlsPlaybackStop) {

        // wait for 4 beats on 1/4 and 2/4 time signature
        const stopAfterBeats = (timeSignature.count < 3
                                ? 4
                                : timeSignature.count);

        const stopAfterDuration = beatsToSeconds(stopAfterBeats, {tempo, timeSignature});

        const stop = now.local > beatGestureLastTime + stopAfterDuration;
        if(stop) {
          app.events.emit('playback', false);
        }
      }

      outputData['tempo'] = tempo;

      const outputPosition = (playback
                              ? {
                                  bar: positionWithOffset.bar,
                                  beat: positionWithOffset.beat,
                                  barChange,
                                  beatChange,
                              }
                              : {
                                  bar: positionStopped.bar,
                                  beat: positionStopped.beat,
                                  barChange: false,
                                  beatChange: false,
                              });
      if(isNaN(outputPosition.bar) || isNaN(outputPosition.beat) ) {
        debugger;
      }
      outputData['position'] = outputPosition;

      if(playback) {
        positionLast = position;
        positionWithOffsetLast = positionWithOffset;
      }

      // clock always advances
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