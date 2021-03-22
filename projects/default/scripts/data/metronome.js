function metronome(graph, helpers, outputFrame) {
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

  const updateParams = (updates) => {
    if(typeof updates.tempo !== 'undefined') {
      tempo = updates.tempo;
    }

    if(typeof updates.timeSignature !== 'undefined') {
      timeSignature = updates.timeSignature;
    }

    if(typeof updates.seekPosition !== 'undefined') {
      positionLast = updates.position;
      positionLastTime = 0;
    }
  };

  ///// Events and data (defined only in browser)
  const registeredEvents = [];
  if(app.events && app.state) {
    [
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
      const now = inputData['time'].audio;

      outputData['tempo'] = tempo;
      outputData['timeSignature'] = timeSignature;

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

      positionLast = {bar, beat};
      positionLastTime = now;

      outputData['position'] = positionLast;
      return outputFrame;
    },

    destroy() {
      registeredEvents.forEach( ([event, callback]) => {
        app.events.removeListener(event, callback);
      });
    },

  };
}