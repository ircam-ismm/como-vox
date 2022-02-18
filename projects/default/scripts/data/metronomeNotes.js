function clickGenerator(graph, helpers, outputFrame) {
  const pitchHigh = 91; // G6
  const pitchLow = 86; // D6

  const channel = 'metronome';
  let pitch = pitchLow;
  const intensity = 60;
  const duration = 0.5; // in beats

  const parameters = {
    metronomeSound: false,
  };

  const updateParams = (updates) => {
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
      'metronomeSound',
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

    // called on each sensor frame
    process(inputFrame, outputFrame) {
      const inputData = app.data;
      const outputData = app.data;

      const position = inputData['position'];
      const notes = [];
      const notesContainer = inputData['notes'] || {};
      notesContainer[channel] = notes;

      const bar = position.bar;
      const beat = position.beat;

      const trigger = parameters.metronomeSound
            && (position.beatChange || position.barChange);

      if(!trigger) {
        // empty notes container
        outputData['notes'] = notesContainer;
        return outputFrame;
      }

      if(position.barChange) {
        pitch = pitchHigh;
      } else {
        pitch = pitchLow;
      }

      // put beat back in time (with look-ahead for playback)
      notes.push({
        position: {
          bar: position.bar,
          beat: Math.floor(position.beat),
        },
        pitch,
        intensity,
        duration,
      });

      outputData['notes'] = notesContainer;
      return outputFrame;
    },

    destroy() {
      registeredEvents.forEach( ([event, callback]) => {
        app.events.removeListener(event, callback);
      });
    },

  };
}