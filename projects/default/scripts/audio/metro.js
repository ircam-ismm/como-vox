function metro(graph, helpers, audioInNode, audioOutNode, outputFrame) {
  const audioContext = graph.como.audioContext;
  // @example
  let lastIntensity = 0;
  let index = 0;
  
//   const $p = document.createElement('p');
//   document.body.appendChild($p);

  return {
    // called on each sensor frame
    process(inputFrame, outputFrame) {
//       const beat = inputFrame.data['beat'] === 1;
      const beat = inputFrame.data['kick'] === 1;

      if (beat) {
        // we should trigger the next beat, taking latency into account...
        // we have a lot of jitter in Android
        // adding 0.02 to currentCurrent time seems to prevent 
        // dropouts in Android (at least less than using currentTime only...
        const now = audioContext.currentTime + 0.02;
        
        const env = audioContext.createGain();
        env.connect(audioOutNode);
        env.gain.value = 0;
        env.gain.setValueAtTime(1, now);
        env.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
        
        const sine = audioContext.createOscillator();
        sine.connect(env);
        sine.frequency.value = index === 0 ? 1600 : 1200;
        sine.start(now);
        sine.stop(now + 0.03);
        
//         lastIntensity = Math.sqrt(inputFrame.data['intensity'][0]);
        
//         $p.textContent = index;
        index = (index + 1) % 4;
        
      }
    },
    destroy() {
      
    },
  }
}