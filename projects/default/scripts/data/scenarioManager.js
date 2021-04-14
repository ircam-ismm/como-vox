function scenarioManager(graph, helpers, outputFrame) {
  const app = (typeof global !== 'undefined' ? global.app : window.app);

  const scenarioNames = [
    'scenarioLatencyCalibration',
    'scenarioStartStopWithBeating',
  ];

  const noteChannel = 'scenario';

  const parameters = {
    scenarioCurrent: null,
  };
  scenarioNames.forEach( (scenarioName) => {
    parameters[scenarioName] = false;
  });

  const updateParams = (updates) => {

    if(typeof updates.scenarioCurrent !== 'undefined') {
      // exclusive scenarioCurrent: disable others
      parameters.scenarioCurrent = updates.scenarioCurrent;
      scenarioNames.forEach( (scenarioName) => {
        if(scenarioName
           && scenarioName !== parameters.scenarioCurrent
           && parameters[scenarioName]) {
          app.events.emit(scenarioName, false);
        }
      });

    }

    // set active scenario as current one
    for(const p of Object.keys(updates) ) {
      if(parameters.hasOwnProperty(p) ) {
        parameters[p] = updates[p];

        const scenarioName = scenarioNames.find( (s) => s === p);
        if(scenarioName) {
          const scenarioActive = updates[p];
          if(scenarioActive) {
            if(parameters.scenarioCurrent !== scenarioName) {
              // active is new current
              parameters.scenarioCurrent = scenarioName;
              app.events.emit('scenarioCurrent', parameters.scenarioCurrent);
            } else {
              // old current one: do nothing
            }
          } else if(scenarioName === parameters.scenarioCurrent) {
            // currently active was disabled, no current any more
            parameters.scenarioCurrent = null;
            app.events.emit('scenarioCurrent', parameters.scenarioCurrent);
          }
        }
      }
    }

    // enable current if defined and not already enabled
    if(parameters.scenarioCurrent && !parameters[parameters.scenarioCurrent]) {
      app.events.emit(parameters.scenarioCurrent, true);
    }

  };

  ///// Events and data (defined only in browser)
  const registeredEvents = [];
  if(app.events && app.state) {
    [
      'scenarioCurrent',
      ...scenarioNames,
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

      const notes = [];
      // reset own channel
      const notesContainer = inputData['notes'] || {};
      notesContainer[noteChannel] = notes;
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