function globalData(graph, helpers, outputFrame) {
  const app = (typeof process !== 'undefined' ? process.app : window.app);
  const scripts = {};

  const metronome = app.imports.scripts.metronome(graph, helpers, outputFrame);
  Object.assign(scripts, {metronome});

  const clickGenerator = app.imports.scripts.clickGenerator(graph, helpers, outputFrame);
  Object.assign(scripts, {clickGenerator});

  // return the function that will executed on each frame
  return {
    updateParams(updates) {
      for(let target in updates) {
        const script = scripts[target];
        if(typeof script !== 'undefined') {
          script.updateParams(updates[target]);
        }
      }
    },

    process(inputFrame, outputFrame) {
      let input = inputFrame;

      let tmpOutput = { data: {} };
      let output = outputFrame;
      Object.assign(tmpOutput.data, output.data); // init

      // first script from input
      scripts.metronome.process(input, tmpOutput);
      Object.assign(output.data, tmpOutput.data); // merge

      scripts.clickGenerator.process(output, tmpOutput);
      Object.assign(output.data, tmpOutput.data); // merge

      console.log('output from script', output);
      return output;
    },

    destroy() {
      for(let s in scripts) {
        scripts[s].destroy();
      }
    },
  };
}
