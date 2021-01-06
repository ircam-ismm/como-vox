function score(graph, helpers, outputFrame) {
  const app = (typeof global !== 'undefined' ? global.app : window.app);

  const conversion = app.imports.helpers.conversion;
  const positionsToBeatsDelta = conversion.positionsToBeatsDelta;
  const barBeatToPosition = conversion.barBeatToPosition;

  let eventsNext = [];
  let positionToSeek = undefined; // undefined to seek to current

  const parameters = {
    onOff: true,
  };

  let score = null;

  const seekPosition = (position) => {
    positionToSeek = (typeof position === 'undefined'
                      ? undefined
                      : {...position});

    eventsNext.fill(undefined);
  }

  const setScore = (scoreRequest) => {
    score = scoreRequest;
    eventsNext.length = (score
                    ? score.partSet.parts.length
                    : 0);
    seekPosition(undefined);
  };

  return {
    updateParams(updates) {
      if(typeof updates.seekPosition !== 'undefined') {
        seekPosition(updates.seekPosition);
      } else if(typeof updates.score !== 'undefined') {
        setScore(updates.score);
      } else {
        Object.assign(parameters, updates);
      }
    },

    // called on each sensor frame
    process(inputFrame, outputFrame) {
      const inputData = inputFrame.data;
      const outputData = outputFrame.data;

      const timeSignature = inputData['timeSignature'];
      const position = inputData['position'];

      if(!parameters.onOff || !score) {
        outputData['notes'] = {};
        outputData['events'] = [];
        return outputFrame;
      }

      const eventContainer = {}; // key is channel
      score.partSet.parts.forEach( (part, p) => {
        const events = part.events;

        // output all notes with respective position
        const notes = [];

        // instrument, volume: output only last of each type
        const nonNotes = {};


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
            Object.assign(nonNotes, barBeatToPosition(event) );
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
            Object.assign(nonNotes, barBeatToPosition(event) );
          } else {
            notes.push(barBeatToPosition(event) );
          }

        }

        eventsNext[p] = e;

        eventContainer[p] = [ ...Object.values(nonNotes), ...notes];

      }); // parts.forEach

      outputData['events'] = eventContainer;

      // console.log("eventContainer = ", eventContainer);

      const notes = [...(Object.values(eventContainer).flat(1))] // flatten all channels
            .filter( (note) => note.type === 'noteOn') // keep only note-ons
          .map( (note) => {
            return {
              position: note.position,
              pitch: note.data.pitch + 12,
              intensity: note.data.intensity,
              duration: 1,
            };
          });

      // if(notes.length > 0) {
      //   console.log("notes = ", notes);
      // }

      outputData['notes'] = {
        score: notes,
      };

      return outputFrame;
    },

    destroy() {

    },
  }
}