function transport(graph, helpers, outputFrame) {
  const app = (typeof process !== 'undefined' ? process.app : window.app);
  const conversion = app.imports.helpers.conversion;
  const secondsToBeats = conversion.secondsToBeats;
  const positionAddBeats = conversion.positionAddBeats;
  const positionsToBeatsDelta = conversion.positionsToBeatsDelta;
  const positionRoundBeats = conversion.positionRoundBeats;

  let tempo = 60;

  let timeSignature = {
    count: 4,
    division: 4,
  };

  let positionLast = {
    bar: 1,
    beat: 1,
  };
  let positionLastTime = 0; // in seconds

  // in beats, around current beat
  // @TODO: for tempo also?
  let beatGestureWindow = {
    min: -0.5,
    max: 0.5,
  };

  let positionRequest = {
    bar: 1,
    beat: 1,
  };
  let positionRequestTime = 0;

  let gestureControlsBeat = true;

  return {
    updateParams(updates) {
      if(typeof updates.tempo !== 'undefined') {
        tempo = updates.tempo;
      }

      if(typeof updates.timeSignature !== 'undefined') {
        timeSignature = updates.timeSignature;
      }

      if(typeof updates.position !== 'undefined') {
        positionLast = updates.position;
        positionLastTime = 0;
        beatGesturePositionLast = updates.position;
        beatGesturePositionLastTime = 0;
      }

      if(typeof updates.gestureControlsBeat !== 'undefined') {
        gestureControlsBeat = updates.gestureControlsBeat;
      }
    },

    process(inputFrame, outputFrame) {
      const inputData = inputFrame.data;
      const outputData = outputFrame.data;
      const now = performance.now() * 0.001;

      outputData['tempo'] = tempo;
      outputData['timeSignature'] = timeSignature;
      outputData['time'] = now;

      // start
      if(positionLastTime === 0) {
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
      if(gestureControlsBeat && beatGesture && beatGesture.trigger) {
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

