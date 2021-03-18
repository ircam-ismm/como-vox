function scenarioManager(graph, helpers, outputFrame) {
  const app = (typeof global !== 'undefined' ? global.app : window.app);

  const scenarioNames = [
    'scenarioStartStopWithBeating',
  ];

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
        if(scenarioName &&
           scenarioName !== parameters.scenarioCurrent
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
            // active is new current
            parameters.scenarioCurrent = scenarioName;
            app.events.emit('scenarioCurrent', parameters.scenarioCurrent);
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
  if(app.events && app.state) {
    [
      'scenarioCurrent',
      ...scenarioNames,
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
      return outputFrame;
    },

    destroy() {
    },

  };
}