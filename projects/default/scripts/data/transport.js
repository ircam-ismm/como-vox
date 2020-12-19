function transport(graph, helpers, outputFrame) {
  const app = (typeof global !== 'undefined' ? global.app : window.app);

  const conversion = app.imports.helpers.conversion;
  const secondsToBeats = conversion.secondsToBeats;
  const positionAddBeats = conversion.positionAddBeats;
  const positionsToBeatsDelta = conversion.positionsToBeatsDelta;
  const positionRoundBeats = conversion.positionRoundBeats;
  const timeDeltaToTempo = conversion.timeDeltaToTempo;

  const math = app.imports.helpers.math;
  const modulo = math.modulo;
  const median = math.median;

  const parameters = {
    tempo: 60,
    timeSignature: {
      count: 4,
      division: 4,
    },

    playback: true,

    gestureControlsBeat: false,

    // in beats, around current beat
    // @TODO: for tempo also?
    beatGestureWindow: {
      min: -0.5,
      max: 0.5,
    },

    gestureControlsTempo: false,

    tempoGestureWindow: {
      bar: 1,
      beat: 0,
    },
  };

  let positionLast = {
    bar: 1,
    beat: 1,
  };
  let positionLastTime = 0; // in seconds

  let positionRequest = {
    bar: 1,
    beat: 1,
  };
  let positionRequestTime = 0;

  let tempoGestures = [];

  const seekPosition = (position) => {
    positionLast = position;
    positionRequest = position;
    positionLastTime = 0;
    tempoGestures.length = 0;
  };

  const setTimeSignature = (timeSignature) => {
    parameters.timeSignature = timeSignature;
    tempoGestures.length = 0;
  }

  return {
    updateParams(updates) {
      if(typeof updates.seekPosition !== 'undefined') {
        seekPosition(updates.seekPosition);
      } else if(typeof updates.timeSignature !== 'undefined') {
        setTimeSignature(updates.timeSignature);
      } else {
        Object.assign(parameters, updates);
      }

    },

    process(inputFrame, outputFrame) {
      const inputData = inputFrame.data;
      const outputData = outputFrame.data;
      const now = performance.now() * 0.001;

      let tempo = parameters.tempo;
      const timeSignature = parameters.timeSignature;

      // do not alias playback as it may change

      const beatGestureWindow = parameters.beatGestureWindow;

      outputData['timeSignature'] = timeSignature;
      outputData['time'] = now;
      outputData['playback'] = parameters.playback;

      // start
      if(!parameters.playback || positionLastTime === 0) {
        outputData['tempo'] = parameters.tempo;
        outputData['position'] = positionLast;
        positionLastTime = now;
        return outputFrame;
      }

      const timeDelta = now - positionLastTime;
      const beatDelta = timeDelta / (60 / tempo) * timeSignature.division / 4;

      let position = positionAddBeats(positionLast, beatDelta);

      const beatGesture = inputData['beat'];
      const beatGestureDeltaFromNow = secondsToBeats(beatGesture.time - now, {
        timeSignature,
        tempo,
      });
      const beatGesturePosition = positionAddBeats(position, beatGestureDeltaFromNow,
                                                   {timeSignature});

      // tempo
      if(parameters.gestureControlsTempo && beatGesture && beatGesture.trigger) {
        tempoGestures.push({
          time: beatGesture.time,
          position: beatGesturePosition
        });

        // maximum number of beats from now
        // and minimum number of tempo gestures
        const deltaMax = parameters.tempoGestureWindow.bar * timeSignature.count
              + parameters.tempoGestureWindow.beat;

        // remove old gestures but keep the same number as deltaMax
        // in order to be able to halve tempo
        for(let g = 0, gesturesKept = tempoGestures.length;
            g < tempoGestures.length && gesturesKept > deltaMax;
            ++g) {
          const gesture = tempoGestures[g];
          if(deltaMax < positionsToBeatsDelta(position, gesture.position) ) {
            tempoGestures[g] = undefined;
            --gesturesKept;
          }
        }
        tempoGestures = tempoGestures.filter( (gesture) => {
          return typeof gesture !== 'undefined';
        });

        let tempos = [];
        let beatDeltas = [];
        for(let g = 1; g < tempoGestures.length; ++g) {
          const timeDelta = tempoGestures[g].time - tempoGestures[g - 1].time;
          const beatDelta = Math.round(
            positionsToBeatsDelta(tempoGestures[g].position,
                                  tempoGestures[g - 1].position,
                                  {timeSignature}));
          if(beatDelta === 1 || beatDelta === 2) {
            const tempoCurrent = timeDeltaToTempo(timeDelta, beatDelta, {timeSignature});
            tempos.push(tempoCurrent);
            beatDeltas.push(beatDelta);
          }
        }

        if(tempos.length > 0) {
          // use median of beatDeltas for integer result to halve tempo
          tempo = median(tempos) / median(beatDeltas);
        }

      }

      // beat position
      if(parameters.gestureControlsBeat
         && beatGesture && beatGesture.trigger) {
        // first, get position with look-behind
        const beatGesturePositionRounded = positionRoundBeats(beatGesturePosition,
                                                              {timeSignature});
        const beatGestureDeltaFromRounded = positionsToBeatsDelta(beatGesturePosition,
                                                                  beatGesturePositionRounded);
        if(beatGestureDeltaFromRounded >= beatGestureWindow.min
           && beatGestureDeltaFromRounded <= beatGestureWindow.max) {
          positionRequest = beatGesturePositionRounded;
          const positionRequestDelta = positionsToBeatsDelta(positionRequest,
                                                             position, {timeSignature});
          if(positionRequestDelta < 0) {
            // backward
            // use positionRequest for monotonic output until current position is
            // reached again
            // @TODO: smooth
            [position, positionRequest] = [positionRequest, position];
          } else {
            // forward
            // @TODO: smooth
            position = positionRequest;
          }

          positionRequestTime = now;
        } // beat in window
      } // beatGesture

      // max(positionRequest, position) to ensure monotonic output
      const positionRequestDelta = positionsToBeatsDelta(positionRequest,
                                                         position, {timeSignature});
      if(positionRequestDelta > 0) {
        // wait
        outputData['position'] = positionRequest;
      } else {
        outputData['position'] = position;
      }

      outputData['tempo'] = tempo;
      parameters.tempo = tempo;

      positionLast = position;
      positionLastTime = now;

      return outputFrame;
    },
    destroy() {

    },
  };
}