function score(graph, helpers, outputFrame) {
  const app = (typeof global !== 'undefined' ? global.app : window.app);

  const conversion = app.imports.helpers.conversion;
  const positionsToBeatsDelta = conversion.positionsToBeatsDelta;
  const barBeatToPosition = conversion.barBeatToPosition;
  const positionAddSeconds = conversion.positionAddSeconds;

  let eventsNext = [];
  let positionToSeek = undefined; // undefined to seek to current

  const humaniseJitter = 20e-3; // in seconds

  const parameters = {
    playback: true,
    tempo: undefined,
    timeSignature: undefined,
    humanise: true,
  };

  let score = null;

  let scoreTempo = undefined;
  let scoreTempoChanged = false;

  let scoreTimeSignature = {count: 4, division: 4};
  let scoreTimeSignatureChanged = false;

  let resetParts = undefined;

  const resetPartsRequest = () => {
    if(resetParts) {
      // already pending
      return;
    }
    // reset channels of current score
    resetParts = (score
                  ? score.partSet.parts
                  : undefined);
  };

  const seekPosition = (position) => {
    resetPartsRequest();

    positionToSeek = (typeof position === 'undefined'
                      ? undefined
                      : {...position});

    eventsNext.fill(undefined);
  }

  const setScore = (scoreRequest) => {
    resetPartsRequest();

    score = scoreRequest;
    console.log("score = ", score);
    eventsNext.length = (score
                         ? score.partSet.parts.length
                         : 0);
    seekPosition(undefined);

    scoreTempo = undefined;
    scoreTimeSignature = undefined;
    if(score && score.masterTrack) {
      if(score.masterTrack.tempo) {
        scoreTempo = score.masterTrack.tempo;
        scoreTempoChanged = true;
      }

      if(score.masterTrack.timeSignature) {
        scoreTimeSignature = score.masterTrack.timeSignature;
        scoreTimeSignatureChanged = true;
      }
    }
  };

  const setPlayback = (playback) => {
    if(!playback) {
      resetPartsRequest();
    }

    parameters.playback = playback;
  };

  return {
    updateParams(updates) {
      if(typeof updates.seekPosition !== 'undefined') {
        seekPosition(updates.seekPosition);
      }

      if(typeof updates.score !== 'undefined') {
        setScore(updates.score);
      }

      if(typeof updates.playback !== 'undefined') {
        setPlayback(updates.playback);
      }

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

      const timeSignature = inputData['timeSignature'];
      const tempo = inputData['tempo'];
      const position = inputData['position'];

      let resetEvents = (score
                         ? score.partSet.parts.map( part => [] )
                         : []);
      if(resetParts) {
        // reset channels may not match parts
        resetParts.forEach( (part, p) => {
          resetEvents[p] = [
            {
              channel: part.channel,
              type: 'allNotesOff',
              position: { bar: 1, beat: 1},
              data: {},
            },
            // reset also volume, instrument, etc.
          ];
        });
        resetParts = undefined;
      }

      if(!parameters.playback || !score) {
        outputData['notes'] = {};
        outputData['events'] = (resetEvents
                                ? resetEvents
                                : []);

        return outputFrame;
      }

      const eventContainer = {}; // key is channel

      score.partSet.parts.forEach( (part, p) => {
        const events = part.events;

        // output all notes with respective position
        const notes = [];

        // instrument, volume: output only last of each type
        const nonNotes = new Map();

        // no next event, yet: start with first
        let e = (typeof eventsNext[p] !== 'undefined'
                 ? eventsNext[p]
                 : 0);

        if(typeof positionToSeek === 'undefined') {
          positionToSeek = {...position};
        }

        // output last non-note events from next (included) to seek (excluded)
        for(;
            e < events.length
            && positionsToBeatsDelta(barBeatToPosition(events[e]),
                                     positionToSeek,
                                     {timeSignature}) < 0;
            ++e) {
          const event = events[e];

          if(event.type !== 'noteOn' && event.type !== 'noteOff') {
            nonNotes.set(event.type, {...event, ...barBeatToPosition(event)});
          }
        }

        // output all notes from seek (included) to position (included)
        for(;
            e < events.length
            && positionsToBeatsDelta(barBeatToPosition(events[e]),
                                     position,
                                     {timeSignature}) <= 0;
            ++e) {
          const event = events[e];

          if(event.type !== 'noteOn' && event.type !== 'noteOff') {
            nonNotes.set(event.type, {...event, ...barBeatToPosition(event)});
          } else {
            const noteEvent = barBeatToPosition(event);
            if(parameters.humanise) {
              const positionHumanised
                    = positionAddSeconds(noteEvent.position,
                                         Math.random() * humaniseJitter,
                                         {timeSignature, tempo});
              noteEvent.position = positionHumanised;
              noteEvent.bar = positionHumanised.bar;
              noteEvent.beat = positionHumanised.beat;
            }
            notes.push(noteEvent);
          }

        }

        eventsNext[p] = e;

        eventContainer[p] = [ ...resetEvents[p], ...nonNotes.values(), ...notes];
      }); // parts.forEach

      // if the current score contains less parts than the previous one
      for(let p = score.partSet.parts.length; p < resetEvents.length; ++p) {
        eventContainer[p] = [ ...resetEvents[p] ];
      }

      let outputTempo;
      if(scoreTempoChanged) {
        outputTempo = scoreTempo;
        scoreTempoChanged = false;
      }

      let outputTimeSignature;
      if(scoreTimeSignatureChanged) {
        outputTimeSignature = scoreTimeSignature;
        scoreTimeSignatureChanged = false;
      }

      outputData['score'] = {
        tempo: outputTempo,
        timeSignature: outputTimeSignature,
      };

      outputData['events'] = eventContainer;

      // // 'notes' output for debug with clickSynth
      // // flatten all channels
      // const notes = [...(Object.values(eventContainer).flat(1))]
      //       // keep only note-ons
      //       .filter( (note) => note.type === 'noteOn')
      //       .map( (note) => {
      //         return {
      //           position: note.position,
      //           pitch: note.data.pitch + 12,
      //           intensity: note.data.intensity,
      //           duration: 1,
      //         };
      //       });

      // outputData['notes'] = {
      //   score: notes,
      // };

      return outputFrame;
    },

    destroy() {

    },
  }
}