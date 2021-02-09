function clackFromBeat(graph, helpers, outputFrame) {
  const audioContext = graph.como.audioContext;
  const app = (typeof global !== 'undefined' ? global.app : window.app);

  const localToAudioContextTime
        = app.imports.helpers.time.localToAudioContextTime;

  const pitch = 82; // Bb5

  const channel = 'clack';

  const intensity = 80;
  const duration = 0.25; // in beats

  const parameters = {
    onOff: true,
  };

  return {
    updateParams(updates) {
      for(const p of Object.keys(updates) ) {
        if(parameters.hasOwnProperty(p) ) {
          parameters[p] = updates[p];
        }
      }
    },

    // called on each sensor frame
    process(inputFrame, outputFrame) {
      const inputData = inputFrame.data;
      const outputData = outputFrame.data;

      const beat = inputData['beat'];
      const time = localToAudioContextTime(beat.time, {audioContext});

      const trigger = parameters.onOff && beat.trigger;

      const notes = [];
      const notesContainer = {};
      notesContainer[channel] = notes;

      if(trigger) {
        notes.push({
          time,
          pitch,
          intensity,
          duration,
        });
      }

      outputData['notes'] = notesContainer;
      return outputFrame;
    },

    destroy() {

    },
  }
}