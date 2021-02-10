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
      const inputData = inputFrame.data;
      const outputData = outputFrame.data;

      const timeSignature = app.data.timeSignature;
      const tempo = app.data.tempo;

      const now = app.data.time;

      const beat = inputData['beat'];
      const trigger = parameters.onOff && beat.trigger;

      const notes = [];
      const notesContainer = {};
      notesContainer[channel] = notes;

      if(trigger) {
        // listen one beat after
        const oneBeatOffset = beatsToSeconds(1, {tempo, timeSignature});

        let time = localToAudioContextTime(beat.time, {audioContext});

        // compensate for audio latency heard while beating
        if(app.data.playbackLatency > 0) {
          time -= app.data.playbackLatency;
          while(time < now.audio) {
            time += oneBeatOffset;
          }
        }

        // debug only
        // const positionAddSeconds = conversion.positionAddSeconds;
        // const position = app.data.position;

        // const beatPosition = positionAddSeconds(position,
        //                                         beat.time - now.local,
        //                                         {tempo, timeSignature});
        // const clackPosition = positionAddSeconds(position,
        //                                          beat.time - now.local
        //                                          - app.data.playbackLatency
        //                                          + beatsToSeconds(1, {tempo, timeSignature}),
        //                                          {tempo, timeSignature});

        // console.log('position', position,
        //             'beat', beatPosition,
        //             'clack', clackPosition);

        // console.log('clack', beat.time,
        //             'from now local', beat.time - now.local,
        //             'scheduled audio', time,
        //             'playback latency', app.data.playbackLatency,
        //             'next beat', beatsToSeconds(1, {tempo, timeSignature}),
        //             'audio time', audioContext.currentTime,
        //             'audio delta', time - audioContext.currentTime,
        //             'position', app.data.position);

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