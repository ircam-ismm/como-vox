function clackFromBeat(graph, helpers, outputFrame) {
  const audioContext = graph.como.audioContext;
  const app = (typeof global !== 'undefined' ? global.app : window.app);
  const conversion = app.imports.helpers.conversion;

  const beatsToSeconds = conversion.beatsToSeconds;
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
      const inputData = app.data;
      const outputData = app.data;

      const timeSignature = inputData['timeSignature'];
      const tempo = inputData['tempo'];

      const now = inputData['time'];

      const beat = inputData['beat'];
      const trigger = parameters.onOff && beat.trigger;

      const notes = [];
      // reset own channel
      const notesContainer = inputData['notes'] || {};
      notesContainer[channel] = notes;

      if(trigger) {
        // listen one beat after
        const oneBeatOffset = beatsToSeconds(1, {tempo, timeSignature});

        // compensate for audio latency heard while beating
        let time = localToAudioContextTime(beat.time, {audioContext});
        let notePitch = pitch;
        const playbackLatency = inputData['playbackLatency'];
        if(playbackLatency > 0) {
          time -= playbackLatency;
          // schedule to the next beat in future
          while(time < now.audio) {
            time += oneBeatOffset;
            // transpose to listen for offset
            notePitch -= 3;
          }
        }

        // debug only
        // const positionAddSeconds = conversion.positionAddSeconds;
        // const position = inputData['position'];

        // const beatPosition = positionAddSeconds(position,
        //                                         beat.time - now.local,
        //                                         {tempo, timeSignature});
        // const clackPosition = positionAddSeconds(position,
        //                                          beat.time - now.local
        //                                          - inputData['playbackLatency']
        //                                          + beatsToSeconds(1, {tempo, timeSignature}),
        //                                          {tempo, timeSignature});

        // console.log('position', position,
        //             'beat', beatPosition,
        //             'clack', clackPosition);

        // console.log('clack', beat.time,
        //             'from now local', beat.time - now.local,
        //             'scheduled audio', time,
        //             'playback latency', inputData['playbackLatency'],
        //             'next beat', beatsToSeconds(1, {tempo, timeSignature}),
        //             'audio time', audioContext.currentTime,
        //             'audio delta', time - audioContext.currentTime,
        //             'position', inputData['position']);

        notes.push({
          time,
          pitch: notePitch,
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