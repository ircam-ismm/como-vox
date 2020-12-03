export function clickGenerator(graph, helpers, outputFrame) {
  outputFrame.data = {};

  let barLast = 0;
  let beatLast = 0;

  const pitchHigh = 91; // D6
  const pitchLow = 86; // G6

  const channel = 'click';
  let pitch = pitchLow;
  const intensity = 127;
  const duration = 50e-3;

  return {
    updateParams(updates) {

    },

    // called on each sensor frame
    process(inputFrame, outputFrame) {
      const inputData = inputFrame.data;

      const outputData = outputFrame.data;

      const position = inputData['position'];
      // const notes = (inputData['notes']
      //                ? inputData['notes'].slice()
      //                : []);
      const notes = [];

      const bar = position[0];
      const beat = position[1];

      let trigger = false;

      if(barLast === 0) {
        // start on a beat
        trigger = (beat % 1 > 0.95 && beat % 1 < 0.05);
        barLast = bar;
        beatLast = beat;
      } else {
        // on beat change
        trigger = Math.floor(beat) !== Math.floor(beatLast);
      }

      if(!trigger) {
        outputData['notes'] = [];
        return outputFrame;
      }

      if(Math.floor(beat) === 1) {
        pitch = pitchHigh;
      } else {
        pitch = pitchLow;
      }

      notes.push({
        channel,
        pitch,
        intensity,
        duration,
      });

      outputData['notes'] = notes;
      barLast = bar;
      beatLast = beat;

      console.log('notes', notes);

      return outputFrame;
    },

    destroy() {

    },
  }
}

export default {clickGenerator};
