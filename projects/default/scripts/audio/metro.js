function metro(graph, helpers, audioInNode, audioOutNode, outputFrame) {
  console.clear();
  const audioContext = graph.como.audioContext;
  // @example
  let lastIntensity = 0;
  let index = 0;

  return {
    // called on each sensor frame
    process(inputFrame, outputFrame) {
      const beat = inputFrame.data['beat'][0] === 1;

      if (beat) {
        // we should trigger the next beat, taking latency into account...
        // we have a lot of jitter in Android
        const now = audioContext.currentTime;
        
        const env = audioContext.createGain();
        // @todo - fix audio chain in CoMo, cf. Fred, 
//         env.connect(audioContext.destination);
        env.gain.value = 0;
        env.gain.setValueAtTime(0, now);
        env.gain.linearRampToValueAtTime(1, now + 0.001);
        env.gain.exponentialRampToValueAtTime(0.0001, now + 0.01);
        
        const sine = audioContext.createOscillator();
        sine.connect(env);
        sine.frequency.value = index === 0 ? 1600 : 1200;
        sine.start(now);
        sine.stop(now + 0.03);
        
        lastIntensity = Math.sqrt(inputFrame.data['intensity'][0]);
        
        index = (index + 1) % 4;
      }
    },
    destroy() {
      
    },
  }
}