function beatAuto(graph, helpers, outputFrame) {
  console.clear();

  let lastBeatTime = -Infinity;
  // we need to be able to change that...
  const BPM = 60;
  const period = 60 / BPM;
  
  // return the function that will executed on each frame
  return function(inputFrame, outputFrame) {
    const inputData = inputFrame.data;
    // this time (syncTime) is very bad due audioContext resolution...
    // const frameTime = inputData.metas[1];
    const now = Date.now() / 1000;

    // allow a small jitter coming from the resampler
    if (now - lastBeatTime >= period - 0.005) {
      outputFrame.data['beat'] = [1];
      lastBeatTime = now;
    } else {
      outputFrame.data['beat'] = [0];
    }
    
//     console.log(outputFrame.data);
    return outputFrame;
  }
}