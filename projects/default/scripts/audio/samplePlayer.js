function samplePlayer(graph, helpers, audioInNode, audioOutNode, outputFrame) {
  const volumeDefault = 127;

  // samples playing, volume...
  const parts = {}; // change to channels, instead of parts?

  const app = (typeof global !== 'undefined' ? global.app : window.app);

  const getTime = app.imports.helpers.time.getTime;

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
  const performanceToAudioContextTime = conversion.performanceToAudioContextTime;
  const beatsToSeconds = conversion.beatsToSeconds;

  const audioContext = graph.como.audioContext;

  const pianoSampleManager = app.instruments.pianoSampleManager;

  const fadeOutDuration = 0.1; // in seconds

  const parameters = {
    intensityRange: 30, // in dB
  };

  const noteOn = ({
    time,
    pitch,
    intensity,
    sampleManager = pianoSampleManager,
    samplesPlaying,
  } = {}) => {

    const buffer = pianoSampleManager.get(pitch);
    if(buffer) {
      const source = audioContext.createBufferSource();
      source.buffer = buffer;

      const envelope = audioContext.createGain();
      source.connect(envelope);
      envelope.gain.value = midiIntensityToAmplitude(intensity, {
        range: parameters.intensityRange,
      });

      envelope.connect(audioOutNode);

      samplesPlaying.set(pitch, {source, envelope});
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

  return {
    updateParams(updates) {
      Object.assign(parameters, updates);
    },

    process(inputFrame) {
      const lookAheadSeconds = app.data.lookAheadSeconds;

      const inputData = inputFrame.data;

      const currentPosition = inputData['position'];
      // use logical time tag from frame
      const now = inputData['time'];

      const timeSignature = inputData['timeSignature'];
      const tempo = inputData['tempo'];

      const eventsContainer = inputData['events'];
      if(!eventsContainer) {
        return;
      }

      eventsContainer.forEach( (events, part) => {
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
          const timeOffset = getTime() - now;

          // remove timeOffset from logical time to compensate,
          // add event offset and lookahead
          const currentTime = performanceToAudioContextTime(
            performance.now()
              + 1e3 * (lookAheadSeconds + eventOffset
                       - timeOffset),
            {audioContext});

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

      });
    },

    destroy() {
    },

  }
}