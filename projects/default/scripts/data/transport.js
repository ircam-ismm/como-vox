function transport(graph, helpers, outputFrame) {
  const app = (typeof process !== 'undefined' ? process.app : window.app);
  const conversion = app.imports.helpers.conversion;
  const secondsToBeats = conversion.secondsToBeats;
  const positionAddBeats = conversion.positionAddBeats;
  const positionsToBeatsDelta = conversion.positionsToBeatsDelta;
  const positionRoundBeats = conversion.positionRoundBeats;

  const parameters = {
    tempo: 60,
    timeSignature: {
      count: 4,
      division: 4,
    },

    playback: true,

    gestureControlsBeat: true,

    // in beats, around current beat
    // @TODO: for tempo also?
    beatGestureWindow:  {
      min: -0.5,
      max: 0.5,
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

  return {
    updateParams(updates) {
      if(typeof updates.position !== 'undefined') {
        positionLast = updates.position;
        positionLastTime = 0;
        beatGesturePositionLast = updates.position;
        beatGesturePositionLastTime = 0;
      } else {
        Object.assign(parameters, updates);
      }

    },

    process(inputFrame, outputFrame) {
      const inputData = inputFrame.data;
      const outputData = outputFrame.data;
      const now = performance.now() * 0.001;

      const tempo = parameters.tempo;
      const timeSignature = parameters.timeSignature;

      // do not alias playback as it may change

      const gestureControlsBeat = parameters.gestureControlsBeat;
      const beatGestureWindow = parameters.beatGestureWindow;

      outputData['tempo'] = tempo;
      outputData['timeSignature'] = timeSignature;
      outputData['time'] = now;
      outputData['playback'] = parameters.playback;

      // start
      if(!parameters.playback || positionLastTime === 0) {
        outputData['position'] = positionLast;
        positionLastTime = now;
        return outputFrame;
      }

      const timeDelta = now - positionLastTime;
      const beatDelta = timeDelta / (60 / tempo) * timeSignature.division / 4;

      // modulo shifted by 1, for bar starting at 1
      const beat = (positionLast.beat + beatDelta - 1 + timeSignature.count)
            % timeSignature.count + 1;

      const barDelta = (positionLast.beat - 1 + beatDelta) / timeSignature.count;
      const bar = Math.floor(positionLast.bar + barDelta);

      let position = {bar, beat};

      const beatGesture = inputData['beat'];
      if(parameters.gestureControlsBeat
         && beatGesture && beatGesture.trigger) {
        // first, get position with look-behind
        let beatGestureDeltaFromNow = secondsToBeats(beatGesture.time - now, {
          timeSignature,
          tempo,
        });
        const beatGesturePosition = positionAddBeats(position, beatGestureDeltaFromNow,
                                                     {timeSignature});
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
            [position, positionRequest] = [positionRequest, position];
          } else {
            // forward
            position = positionRequest;
          }

          positionRequestTime = now;
        } // beat in window
      } // beatGesture

      // max(positionRequest, position) to ensure monotonic output
      const positionRequestDelta = positionsToBeatsDelta(positionRequest,
                                                         position, {timeSignature});
      // console.log("positionRequestDelta = ", positionRequestDelta);

      if(positionRequestDelta > 0) {
        // wait
        outputData['position'] = positionRequest;
      } else {
        outputData['position'] = position;
      }

      positionLast = position;
      positionLastTime = now;

      return outputFrame;
    },
    destroy() {

    },
  };
}
