function measures(graph, helpers, outputFrame) {
  const app = (typeof global !== 'undefined' ? global.app : window.app);

  const math = app.imports.helpers.math;

  const clear = () => {
    app.measures = {
      beatOffsetsSeconds: [],
      beatOffsetsSecondsStatistics: {},
      beatOffsetsBeats: [],
      beatOffsetsBeatsStatistics: {},
      tempos: [],
      temposStatistics: {},
    };
  };
  // initialisation
  clear();

  const finalise = () => {
    [
      ['beatOffsetsSeconds', 'beatOffsetsSecondsStatistics'],
      ['beatOffsetsBeats', 'beatOffsetsBeatsStatistics'],
      ['tempos', 'temposStatistics'],
    ].forEach( ([data, statistics]) => {
      app.measures[statistics] = {
        ...math.meanStandardDeviation(app.measures[data]),
        median: math.median(app.measures[data]),
      };
    });
  };

  const parameters = {
    measures: true,
  };

  const updateParams = (updates) => {
    if(updates['measuresClear']) {
      clear();
    }

    if(updates['measuresFinalise']) {
      finalise();
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
      'measures',
      'measuresFinalise',
      'measuresClear',
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

    process(imputFrame, outputFrame) {
      if(!parameters['measures']) {
        return outputFrame;
      }

      const inputData = app.data;
      const outputData = app.data;

      const measuresContainer = inputData['measures'] || {};

      const {
        beatOffsetsSecondsStatistics,
        beatOffsetsBeatsStatistics,
        temposStatistics,
      } = app.measures;

      Object.assign(measuresContainer, {
        beatOffsetsSecondsStatistics,
        beatOffsetsBeatsStatistics,
        temposStatistics,
      });

      outputData['measures'] = measuresContainer;
      return outputFrame;
    },

    destroy() {
      clear();
      registeredEvents.forEach( ([event, callback]) => {
        app.events.removeListener(event, callback);
      });
    },

  };
}