function transport(graph, helpers, outputFrame) {
  const app = (typeof global !== 'undefined' ? global.app : window.app);

  const conversion = app.imports.helpers.conversion;
  const notesToSeconds = conversion.notesToSeconds;
  const notesToBeats = conversion.notesToBeats;
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
  let tempoLast = tempoDefault;

  const timeSignatureDefault = {
    count: 4,
    division: 4,
  };

  const parameters = {
    timeSignature: timeSignatureDefault,
    playback: true,
    playbackStartAfterCount: {
      bar: 1,
      beat: 1, // one more for upbeat before start
    },
    playbackStopAfterCount: {
      bar: 1,
      beat: 0,
    },
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
      absoluteMax: 160,
      relativeMin: 0.51,
      relativeMax: 1.49,
    },
    beatGestureWaitingDurationMax: 2, // in seconds, for time-out
  };

  let playbackStartNew = false;
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

  let beatOffsetLast = 0;

  // more stable when tempo is higher
  const beatOffsetSmoothDurationFromTempo = new Scaler({
    inputStart: 60, // bpm
    inputEnd: 120,
    outputStart: 1, // seconds
    outputEnd: 1, // 2
    type: 'linear',
    clip: true,
  });

  // initialisation with fixed value
  const beatOffsetSmoother = new Scaler({
    inputStart: 0,
    inputEnd: 0,
    outputStart: 0,
    outputEnd: 0,
    type: 'linear',
    clip: true,
  });

  // auto start
  let beatGestureStartTime = positionStoppedTime;

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
    parameters.gestureControlsPlaybackStart = control;
    if(control) {
      playbackStartRequest = null;
      beatGestures.length = 0;
      beatGestureLastTime = 0;
      beatChanges.length = 0;
      beatGestureStartTime = app.data['time'];
    }
  };

  const setPlayback = (playback) => {
    if(playback === parameters.playback) {
      return;
    }

    playbackStartRequest = null;

    if(playback) {
      playbackStartNew = true;
    } else {
      positionStopped = positionWithOffsetLast;

      beatGestures.length = 0;
      beatGestureLastTime = 0;
      beatChanges.length = 0;

      tempoSmoother.set({
        inputStart: 0,
        inputEnd: 0,
        outputStart: tempoLast,
        outputEnd: tempoLast,
      });

      beatOffsetSmoother.set({
        inputStart: 0,
        inputEnd: 0,
        outputStart: 0,
        outputEnd: 0,
      });

      // reset also stopped time on pause
      positionStoppedTime = app.data['time'];
      beatGestureStartTime = app.data['time'];
    }
    app.data['playback'] = playback;
  };

  const seekPosition = (position) => {
    if(!position) {
      // seekPosition is an event, thus nullable
      return;
    }
    const timeSignature = app.data['timeSignature'];

    // given position is position with offset
    positionStopped = position;
    // keep last positionStoppedTime
    positionWithOffsetLast = position;
    positionLast = positionAddBeats(position, -beatOffsetLast, {timeSignature});

    positionLastTime = {
      audio: 0,
      local: 0,
    };

    beatChanges.length = 0;
    // do not reset tempo or beatOffset smoothers to ensure continuity
    // (auto-start, loop, etc.)
  }

  const setTimeSignature = (timeSignature) => {
    parameters.timeSignature = timeSignature;
  }

  const updateParams = (updates) => {
    if(typeof updates.playback !== 'undefined') {
      setPlayback(updates.playback);
    }

    if(typeof updates.gestureControlsPlaybackStart !== 'undefined') {
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

      tempoLast = updates.tempo;
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
      'beatGestureWaitingDurationMax',
      'gestureControlsBeatOffset',
      'gestureControlsPlaybackStart',
      'gestureControlsPlaybackStop',
      'gestureControlsTempo',
      'playback',
      'playbackStartAfterCount',
      'playbackStopAfterCount',
      'tempo',
      'seekPosition',
      'timeSignature',
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
      // use logical time tag from frame
      // - now.audio for eveything related to position
      // - now.local for beat from gestures
      const now = inputData['time'];

      const timeSignature = parameters.timeSignature;

      // do not alias playback as it may change

      outputData['timeSignature'] = timeSignature;

      if(playbackStartRequest && now.local >= playbackStartRequest.time) {
        const {time, tempo, position, beatOffset} = playbackStartRequest;

        // reset beat gestures for a stable start
        beatGestures.length = 0;

        // immediately set fixed values
        beatOffsetSmoother.set({
          inputStart: 0,
          inputEnd: 0,
          outputStart: beatOffset,
          outputEnd: beatOffset,
        });
        beatOffsetLast = beatOffset;

        tempoSmoother.set({
          inputStart: 0,
          inputEnd: 0,
          outputStart: tempo,
          outputEnd: tempo,
        });
        tempoLast = tempo;

        positionWithOffsetLast = position;
        positionLast = positionAddBeats(position, -beatOffset, {timeSignature});

        const timeOffsetFromNow = time - now.local;
        positionLastTime = {
          audio: now.audio + timeOffsetFromNow,
          local: now.local + timeOffsetFromNow,
        };

        // positionLastTime = {
        //   audio: 0,
        //   local: 0,
        // };

        console.log('playbackStartRequest', position);

        app.events.emit('playback', true);
        playbackStartRequest = null;
      }

      const playback = inputData['playback'];
      if(playback !== parameters.playback) {
        updateParams({playback});
      }

      const tempo = tempoSmoother.process(now.audio);
      // const tempo = tempoSmoother.process(now.audio) * 1.05;
      const beatOffset = beatOffsetSmoother.process(now.audio);

      const playbackLatency = inputData['playbackLatency'];
      const lookAheadNotes = app.data.lookAheadNotes;

      // stop
      if(!parameters.playback) {
        outputData['tempo'] = tempo;
        tempoLast = tempo;

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

        if(!parameters.gestureControlsPlaybackStart) {
          return outputFrame;
        }
      }

      const timeDelta = (playback && positionLastTime.audio !== 0
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
      if(playback
         && (positionLastTime.audio === 0 || playbackStartNew) ) {
        // start
        beatChange = positionStopped.beat === Math.floor(positionStopped.beat);
        barChange = beatChange && positionStopped.beat === 1;
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
          playbackLatency,
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
                                 playbackLatency,
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
          const beatReference = beatGesture.beatReference;

          // time related to scheduled audio output:
          // compensate for look-ahead latency
          const beatDeltaFromPlayback = secondsToBeats(
            beatChangeLastTime.local - (beatGesture.time - beatReference.playbackLatency),
            {timeSignature, tempo});

          // consider only one bar from now,
          // plus and one beat for the fluctuations
          if(beatDeltaFromPlayback > timeSignature.count + 1) {
            break;
          }

          // time related to scheduled audio output:
          // compensate for look-ahead latency
          const beatDeltaFromReference = secondsToBeats(
             beatReference.time.local - (beatGesture.time - beatReference.playbackLatency),
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
        if(parameters.gestureControlsBeatOffset
           && offsets.length >= 2) {
          const beatOffsetSmoothDuration
                = beatOffsetSmoothDurationFromTempo.process(tempo);
          const beatOffsetNew = weightedMean(offsets, offsetWeights);
          beatOffsetSmoother.set({
            inputStart: now.audio,
            inputEnd: now.audio + beatOffsetSmoothDuration,
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
        const barCount = (timeSignature.count > 3
                          ? timeSignature.count
                          : 4);

        // keep some beats for look-ahead
        const startLookAheadBeats =
              notesToBeats(lookAheadNotes, {timeSignature});

        // warning: this is a float
        const startAfterBeatsWithLookAhead
              = parameters.playbackStartAfterCount.bar * barCount
              + parameters.playbackStartAfterCount.beat
              - startLookAheadBeats;

        const {
          absoluteMin: tempoAbsoluteMin,
          absoluteMax: tempoAbsoluteMax,
          relativeMin: tempoRelativeMin,
          relativeMax: tempoRelativeMax,
        } = parameters.tempoLimits;


        const beatGesturesStart = [];
        // keep gestures after stop, do not change ordering
        for(let g = 0; g < beatGestures.length; ++g) {
          if(beatGestures[g].time < positionStoppedTime
             || beatGestures[g].time < beatGestureStartTime) {
            continue;
          }
          beatGesturesStart.push(beatGestures[g]);
        }

        // cancel as soon as there is something wrong

        // beating is already too late
        if(beatGesturesStart.length > 0) {
          const last = beatGesturesStart.length - 1;
          const timeDelta = now.local
                - beatGesturesStart[last].time
                - playbackLatency
                - parameters.beatGestureWaitingDurationMax;
          const tempoNow = timeDeltaToTempo(timeDelta,
                                            1,
                                            {timeSignature});
          if(tempoNow > 0 &&
             (tempoNow < tempoAbsoluteMin
              || tempoNow < tempoRelativeMin * tempo) ) {
            console.log('no start, no more beating', tempoNow);
            app.events.emit('gestureControlsPlaybackStart', false);
          }
        }

        // check last tempo
        if(beatGesturesStart.length > 1) {
          const last = beatGesturesStart.length - 1;

          const timeDelta = beatGesturesStart[last].time - beatGesturesStart[last - 1].time;
          const tempoFromGesture = timeDeltaToTempo(timeDelta,
                                                    1,
                                                    {timeSignature});
          if(tempoFromGesture < tempoAbsoluteMin
             || tempoFromGesture > tempoAbsoluteMax
             || tempoFromGesture < tempoRelativeMin * tempo
             || tempoFromGesture > tempoRelativeMax * tempo) {
            console.log('no start, tap tempo out of bounds', tempoFromGesture,
                        'absolute', tempoAbsoluteMin, tempoAbsoluteMax,
                        'relative to', tempo,
                        tempoRelativeMin, tempoRelativeMin * tempo,
                        tempoRelativeMax, tempoRelativeMax * tempo);
            app.events.emit('gestureControlsPlaybackStart', false);
          }
        }

        // note: there is one beat less than the possible maximum, to cope with
        // the added latency of beat gesture analysis and audio playback
        if(beatGesturesStart.length >= Math.floor(startAfterBeatsWithLookAhead) ) {
          // restart on first beat of current bar
          const positionStart = {
            bar: positionStopped.bar,
            beat: 1,
          };

          const positionsStart = [];

          for(let g = beatGesturesStart.length; g > 0; --g) {
            positionsStart.push(positionAddBeats(positionStart, -1 - g, {timeSignature}) );
          }

          ////// tempo
          // @TODO: factorise tempo computation

          let tempos = [];
          for(let g = 1; g < beatGesturesStart.length; ++g) {
            const timeDelta = beatGesturesStart[g].time - beatGesturesStart[g - 1].time;
            const tempoFromGesture = timeDeltaToTempo(timeDelta,
                                                      1,
                                                      {timeSignature});
            if(tempoFromGesture > tempoAbsoluteMin
               && tempoFromGesture < tempoAbsoluteMax
               && tempoFromGesture > tempoRelativeMin * tempo
               && tempoFromGesture < tempoRelativeMax * tempo) {
              tempos.push(tempoFromGesture);
            } else {
            console.log('no start, tap tempo out of bounds', tempoFromGesture,
                        'absolute', tempoAbsoluteMin, tempoAbsoluteMax,
                        'relative to', tempo,
                        tempoRelativeMin, tempoRelativeMin * tempo,
                        tempoRelativeMax, tempoRelativeMax * tempo);
              app.events.emit('gestureControlsPlaybackStart', false);
            }

          }

          // avoid extra or missing beats
          // one less because tempos are intervals between gestures
          if(tempos.length !== beatGesturesStart.length - 1) {
            console.log('no start, wrong number of beat gestures',
                        'beatGesturesStart.length', beatGesturesStart.length,
                        'tempos.length', tempos.length);
            app.events.emit('gestureControlsPlaybackStart', false);
          } else {

            // last index of gesture corresponding to the first beat of a bar
            // (or first beat gesture)
            let beatGestureStartReference = 0;
            for(let g = 0; g < positionsStart.length; ++g) {
              if(positionsStart[g].beat === 1) {
                beatGestureStartReference = g;
              }
            }

            // use mean for stability, instead of median
            const tempoStart = mean(tempos);

            /////// beat offset
            let offsets = [];
            let offsetWeights = [];

            // includes all gestures for global estimation, including reference
            for(let g = 0; g < beatGesturesStart.length; ++g) {
              // time related to first beat
              const beatDeltaFromReference = secondsToBeats(
                beatGesturesStart[beatGestureStartReference].time
                  - beatGesturesStart[g].time,
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
              // do not use positionWithOffset, to reset offset
              const beatGesturePosition
                    = positionAddBeats(positionsStart[beatGestureStartReference],
                                       beatDeltaFromReference,
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

            // Start time from first beat gesture whose offset is 0
            const durationFromReferenceGesture = positionDeltaToSeconds({
              bar: 0,
              beat: startAfterBeatsWithLookAhead - beatGestureStartReference,
            }, {
              tempo: tempoStart,
              timeSignature
            })

            //
            const timeStart = beatGesturesStart[beatGestureStartReference].time
                  + durationFromReferenceGesture
                  + beatOffsetStart;

            // start without beatOffset but do feed the smoother
            // (for continuity with the next beating gestures)
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
        const barCount = (timeSignature.count > 3
                          ? timeSignature.count
                          : 4);
        const stopAfterBeats
              = parameters.playbackStopAfterCount.bar * barCount
              + parameters.playbackStopAfterCount.beat;

        const stopAfterDuration = beatsToSeconds(stopAfterBeats, {tempo, timeSignature});

        const stop = now.local > beatGestureLastTime + stopAfterDuration;
        if(stop) {
          app.events.emit('playback', false);
        }
      }

      outputData['playback'] = parameters.playback;

      if(parameters.playback) {
        outputData['tempo'] = tempo;
        tempoLast = tempo;

        const outputPosition = {
          bar: positionWithOffset.bar,
          beat: positionWithOffset.beat,
          barChange,
          beatChange,
        };
        if(isNaN(outputPosition.bar) || isNaN(outputPosition.beat) ) {
          debugger;
        }

        outputData['position'] = outputPosition;
        positionLast = position;
        positionWithOffsetLast = positionWithOffset;
        beatOffsetLast = beatOffset;
      }

      playbackStartNew = false;

      // clock always advances
      positionLastTime = {
        audio: now.audio,
        local: now.local,
      };

      return outputFrame;
    },

    destroy() {
      registeredEvents.forEach( ([event, callback]) => {
        app.events.removeListener(event, callback);
      });
    },

  };
}