function metronome(graph, helpers, outputFrame) {
  let tempo = 60;

  let timeSignature = [4, 4];

  let positionLast = [1, 1]; // bar, beat
  let positionLastTime = 0; // in seconds

  return {
    updateParams(updates) {
      if(typeof updates.tempo) {
        tempo = updates.tempo;
      }

      if(typeof updates.timeSignature) {
        tempotimeSignature = updates.timeSignature;
      }

      if(typeof updates.position) {
        positionLast = updates.position;
        positionLastTime = 0;
      }
    },

    process(inputFrame, outputFrame) {
      const now = performance.now() * 0.001;

      const outputData = outputFrame.data;

      // start
      if(positionLastTime === 0) {
        outputData['position'] = positionLast;
        positionLastTime = now;
        return outputFrame;
      }

      const timeDelta = now - positionLastTime;
      const beatDelta = timeDelta / (60 / tempo) * timeSignature[1] / 4;

      // modulo shifted by 1, for bar starting at 1
      const beat = (positionLast[1] + beatDelta - 1 + timeSignature[0])
            % timeSignature[0] + 1;

      const barDelta = (positionLast[1] - 1 + beatDelta) / timeSignature[0];
      const bar = Math.floor(positionLast[0] + barDelta);

      positionLast = [bar, beat];
      positionLastTime = now;

      outputData['position'] = positionLast;
      return outputFrame;
    },
    destroy() {

    },
  };
}