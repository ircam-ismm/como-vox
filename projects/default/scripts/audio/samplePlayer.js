function samplePlayer(graph, helpers, audioInNode, audioOutNode, outputFrame) {
  const volumeDefault = 127;

  // samples playing, volume...
  const parts = {}; // change to channels, instead of parts?

  const app = (typeof global !== 'undefined' ? global.app : window.app);

  const getLocalTime = app.imports.helpers.time.getLocalTime;

  let nowLast = 0;
  let currentTimeLast = 0;
  let timeLast = 0;
  let eventPositionTimeLast = 0;
  let eventTimeLast = 0;

  const conversion = app.imports.helpers.conversion;

  const dBToAmplitude = conversion.dBToAmplitude;
  const midiPichToHertz = conversion.midiPitchToHertz;
  const midiIntensityToAmplitude = conversion.midiIntensityToAmplitude;
  const positionDeltaToSeconds = conversion.positionDeltaToSeconds;
  const positionsToSecondsDelta = conversion.positionsToSecondsDelta;
  const beatsToSeconds = conversion.beatsToSeconds;

  const Scaler = app.imports.helpers.Scaler;
  const Clipper = app.imports.helpers.Clipper;

  const audioContext = graph.como.audioContext;

  const pianoSampleManager = app.instruments.pianoSampleManager;

  const fadeOutDuration = 0.1; // in seconds

  let noteIntensityHeadroom = 0; // in MIDI intensity

  const parameters = {
    audioIntensityRange: 40, // in dB 30

    samplePlayerFilterNoteIntensityMin: 0, // MIDI intensity 0
    samplePlayerFilterNoteIntensityMax: 127, // MIDI intensity 127
    samplePlayerFilterRelativePitchMin: 12, // MIDI pitch, relative to note (12 is one octave) 12
    samplePlayerFilterRelativePitchMax: 84, // MIDI pitch, relative to note 84
    samplePlayerFilterFrequencyMin: 1000, // in Hz 3000
    samplePlayerFilterFrequencyMax: 22050, // in Hz 22050

    noteIntensityMax: 120,

    scoreIntensityCompressionMax: 120,
  };

  const intensityToRelativePitch = new Scaler({
    inputStart: parameters.samplePlayerFilterNoteIntensityMin,
    inputEnd: parameters.samplePlayerFilterNoteIntensityMax,
    outputStart: parameters.samplePlayerFilterRelativePitchMin,
    outputEnd: parameters.samplePlayerFilterRelativePitchMax,
    type: 'linear',
    clip: true,
  });

  const filterFrequencyClipper = new Clipper({
    min: parameters.samplePlayerFilterFrequencyMin,
    max: parameters.samplePlayerFilterFrequencyMax,
  });

  const noteToFilterFrequency = ({
    pitch,
    intensity,
  }) => {
    const relativePitch = intensityToRelativePitch.process(intensity);

    const frequency = filterFrequencyClipper.process(
      midiPichToHertz(pitch + relativePitch)
    );

    // console.log("noteToFilterFrequency",
    //             "pitch", pitch,
    //             'intensity', intensity,
    //             "relativePitch", relativePitch,
    //             "frequency = ", frequency,
    //            );

    return frequency;
  };

  const noteOn = ({
    time,
    pitch,
    intensity,
    sampleManager = pianoSampleManager,
    samplesPlaying,
  } = {}) => {

    const buffer = sampleManager.get(pitch);
    if(buffer) {
      const source = audioContext.createBufferSource();
      source.buffer = buffer;

      const filter = audioContext.createBiquadFilter();
      source.connect(filter);

      filter.type = 'lowpass';
      filter.Q.value = 0.5; // no resonance 0.5
      filter.frequency.value = noteToFilterFrequency({pitch, intensity});

      const envelope = audioContext.createGain();
      filter.connect(envelope);

      envelope.gain.value = midiIntensityToAmplitude(intensity, {
        range: parameters.audioIntensityRange,
      });

      envelope.connect(audioOutNode);

      samplesPlaying.set(pitch, {source, filter, envelope});
      source.start(time);
    } else {
      // sample sound not available (yet?)
      console.error('no sample for pitch', pitch);
    }

  };

  const noteOff = ({
    time,
    pitch,
    samplesPlaying,
  } = {}) => {

    const samplePlaying = samplesPlaying.get(pitch);
    if(samplePlaying) {
      const {source, envelope} = samplePlaying;
      const stopTime = time + fadeOutDuration;

      const holdValue = envelope.gain.value;
      envelope.gain.cancelScheduledValues(time);
      envelope.gain.setValueAtTime(holdValue, time);
      envelope.gain.linearRampToValueAtTime(dBToAmplitude(-80), stopTime);

      source.stop(stopTime);
      samplesPlaying.delete(pitch);
    }
  };

  const allNotesOff = ({
    time,
    samplesPlaying,
  } = {}) => {
    samplesPlaying.forEach( (sample, pitch) => {
      noteOff({
        time,
        pitch,
        samplesPlaying,
      });
    });

  };

  const updateParams = (updates) => {
    for(const p of Object.keys(updates) ) {
      if(parameters.hasOwnProperty(p) ) {
        parameters[p] = updates[p];
      }
    }

    const {
      samplePlayerFilterNoteIntensityMin,
      samplePlayerFilterNoteIntensityMax,
      samplePlayerFilterRelativePitchMin,
      samplePlayerFilterRelativePitchMax,
      samplePlayerFilterFrequencyMin,
      samplePlayerFilterFrequencyMax,
    } = updates;

    if(typeof samplePlayerFilterNoteIntensityMin !== 'undefined') {
      intensityToRelativePitch.set({
        inputStart: samplePlayerFilterNoteIntensityMin,
      });
    }
    if(typeof samplePlayerFilterNoteIntensityMax !== 'undefined') {
      intensityToRelativePitch.set({
        inputEnd: samplePlayerFilterNoteIntensityMax,
      });
    }

    if(typeof samplePlayerFilterRelativePitchMin !=='undefined') {
      intensityToRelativePitch.set({
        outputStart: samplePlayerFilterRelativePitchMin,
      });
    }
    if(typeof samplePlayerFilterRelativePitchMax !=='undefined') {
      intensityToRelativePitch.set({
        outputEnd: samplePlayerFilterRelativePitchMax,
      });
    }

    if(typeof samplePlayerFilterFrequencyMin !=='undefined') {
      filterFrequencyClipper.set({
        min: samplePlayerFilterFrequencyMin,
      });
    }
    if(typeof samplePlayerFilterFrequencyMax !=='undefined') {
      filterFrequencyClipper.set({
        max: samplePlayerFilterFrequencyMax,
      });
    }

    if(typeof updates.noteIntensityMax !== 'undefined') {
      noteIntensityHeadroom
        = Math.max(0,
                   Math.min(127,
                            parameters.scoreIntensityCompressionMax
                            - parameters.noteIntensityMax));
    }

  };

  ///// Events and data (defined only in browser)
  const registeredEvents = [];
  if(app.events && app.state) {
    const eventsToRegister = Object.keys(parameters);

    eventsToRegister.forEach( (event) => {
      const callback = (value) => {
        // compatibility with setGraphOption
        updateParams({[event]: value});
      };
      registeredEvents.push([event, callback]);
      app.events.on(event, callback);
      // apply current state
      updateParams({[event]: app.state[event]});
    });
  }

  return {
    updateParams,

    process(inputFrame) {
      const inputData = app.data;

      const lookAheadSeconds = inputData['lookAheadSeconds'];

      const currentPosition = inputData['position'];
      // use logical time tag from frame
      const now = inputData['time'].audio;

      const timeSignature = inputData['timeSignature'];
      const tempo = inputData['tempo'];

      const eventsContainer = inputData['events'];
      if(!eventsContainer) {
        return;
      }

      for(const part of Object.keys(eventsContainer) ) {
        const events = eventsContainer[part];
        if(typeof parts[part] === 'undefined') {
          parts[part] = {
            samplesPlaying: new Map(),
            volume: volumeDefault,
          };
        }

        const samplesPlaying = parts[part].samplesPlaying;
        const volume = parts[part].volume;

        events.forEach( (event) => {
          // difference from logical now
          let eventOffset = 0;
          if(event.position) {
            const eventPosition = event.position;
            eventOffset = positionsToSecondsDelta(eventPosition, currentPosition, {
              tempo,
              timeSignature
            });
          } else {
            eventOffset = event.time - now;
          }

          // difference from logical time
          const timeOffset = audioContext.currentTime - now;

          // remove timeOffset from logical time to compensate,
          // add event offset and look-ahead
          const currentTime = audioContext.currentTime
                + lookAheadSeconds + eventOffset
                - timeOffset;

          const eventTime = Math.max(audioContext.currentTime, currentTime);

          switch(event.type) {
            case 'noteOn': {
              // console.log('noteOn', event);
              const pitch = event.data.pitch;
              const intensity = event.data.intensity;
              noteOn({
                time: eventTime,
                pitch,
                intensity,
                samplesPlaying,
              });

              const eventPositionTime = positionDeltaToSeconds(event.position, {
                timeSignature,
                tempo,
              });

              // console.log("currentTime = ", currentTime, audioContext.currentTime,
              //             currentTime - currentTimeLast);
              // currentTimeLast = currentTime;

              // console.log("timeOffset = ", timeOffset);
              // console.log("eventOffset = ", eventOffset);

              // console.log('samplePlayer: event.position2time delta = ', eventPositionTime - eventPositionTimeLast);
              // eventPositionTimeLast = eventPositionTime;

              // console.log('samplePlayer: event.time delta = ', eventTime - eventTimeLast);
              // eventTimeLast = eventTime;

              break;
            }

            case 'noteOff': {
              // console.log('noteOff', event);
              const pitch = event.data.pitch;
              noteOff({
                time: eventTime,
                pitch,
                samplesPlaying,
              });
              break;
            }

            case 'allNotesOff': {
              // console.log('allNotesOff', event);
              Object.values(parts).forEach( (part) => {
                const samplesPlaying = part.samplesPlaying;
                allNotesOff({
                  time: eventTime,
                  samplesPlaying,
                });
              });
              break;
            }

            case 'volume': {
              // console.log('volume', event);
              break;
            }

            default: {
              // ignore the rest
              // console.log('other event');
              break;
            }
          }


        });

      }
    },

    destroy() {
      registeredEvents.forEach( ([event, callback]) => {
        app.events.removeListener(event, callback);
      });
    },

  }
}