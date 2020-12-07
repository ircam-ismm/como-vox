import jzz from 'jzz';;
import jzzMidiSmf from 'jzz-midi-smf';
jzzMidiSmf(jzz);

import {Event, Tempo, TimeSignature, Note} from './event.js';

import {Part} from './Part.js';
import {PartSet} from './PartSet.js';
import {MasterTrack} from './MasterTrack.js';

/**
 * Parse data form a MIDI file to return a PartSet and a MasterTrack.
 *
 * Each Part in partSet is a single track, a single channel,
 * and a single instrument from data.
 *
 * @param {Object} data is a binary from a MIDI file
 * @returns {MasterTrack, PartSet}
 * @throws {Error} when data is not a valid midi file
 */
export function parse(data) {
  const smf = new jzz.MIDI.SMF(data);

  const validation = smf.validate();
  if(validation) {
    throw new Error(`MIDI parse error, invalid data: ${JSON.stringify(validation)}`);
  }

  const ppqn = smf.ppqn || 96; // default resolution

  // there is no master track per se
  // first parse all tracks for master events
  const masterTrack = new MasterTrack();
  masterTrack.ppqn = ppqn;

  const partSet = new PartSet();

  for(let t = 0; t < smf.ntrk; ++t) {
    log('##################### track', t);

    const readTrack = smf[t];

    // defaults
    let instrument;
    let name;
    let tempo = 120;
    let timeSignature = {
      count:4,
      division: 4,
    };
    let tick = 0;
    let bar = 1;
    let beat = 1;

    // tempo or timeSignature
    // let lastChange = {tempo, timeSignature, tick, bar,
    let lastChange = {tick, bar, beat};

    // index with channel, the pitch
    const notesRunning = {};
    for(let channel = 0; channel < 16; ++channel){
      notesRunning[channel] = new Map();
    }

    // for each midi event
    for (let e = 0; e < readTrack.length; e++) {
      const event = readTrack[e];
      const channel = event.getChannel();

      tick = event.tt;

      ({bar, beat} = barBeatAdvance({ppqn, timeSignature, last: lastChange, tick}));

      // Never round bar and beat, except for display,
      // to avoid accumulation of rounding errors.
      // @TODO: check that we do not need rounded beat for tempo change
      // ({bar, beat} = barBeatRound(bar, beat, timeSignature, 96) );

      const display = barBeatRound(bar, beat, timeSignature, 96);
      display.event = {};
      if(event.ff) {
        display.event.ff = hexadecimalAndDecimal(event.ff);
        display.event.text = event.dd;
      }

      for(let i = 0; i < 3; ++i) {
        if(typeof event[i] !== 'undefined') {
          display.event[i] = hexadecimalAndDecimal(event[i]);
        }
      }

      const data = event.getData();
      if(data) {
        display.event.data = data;
      }

      const noteChange = event.isNoteOn() || event.isNoteOff();
      const controlChange = event[0] >= 176 && event[0] <= 191;
      const programChange = event[0] >= 192 && event[0] <= 207;
      const metaChange = typeof event.ff !== undefined;

      // no channel for some events (track name, end of track)
      const trackChange = noteChange
            || controlChange
            || programChange
            || metaChange;

      const tempoChange = event.isTempo();
      const timeSignatureChange = event.isTimeSignature();

      const masterTrackChange = tempoChange
            || timeSignatureChange;

      if(masterTrackChange) {
        if(tick !== lastChange.tick) {
          // keep all simultaneous event?
          // most DAW keep last one
          // score editors may refer to the first one
          Object.assign(lastChange, {
            tick,
            bar,
            beat,
          });

        }

        if(tempoChange) {
          // Use BPM instead of tempo (sic)
          // tempo is the number of microseconds per quarter note
          tempo = event.getBPM();

          masterTrack.events.push(new Tempo({
            tick,
            bar,
            beat,
            tempo,
          }));

          // a file producer may assign a default value and over-ride it
          // keep only the last one in the very beginning
          if(tick === 0) {
            masterTrack.tempo = tempo;
          }

          log('channel', 'master',
              'bar:', bar, '>', display.bar,
              'beat:', beat, '>', roundFixed(display.beat, 5),
              `(${tick})`,
              'tempo:', tempo, '>', Math.round(tempo) );
        } else if(timeSignatureChange) {
          const [count, division] = event.getTimeSignature()
          timeSignature = {count, division};

          masterTrack.events.push(new TimeSignature({
            tick,
            bar,
            beat,
            timeSignature,
          }));

          // a file producer may assign a default value and over-ride it
          // keep only the last one in the very beginning
          if(tick === 0) {
            masterTrack.timeSignature = timeSignature;
          }

          log('channel', 'master',
              'bar:', bar, '>', display.bar,
              'beat:', beat, '>', display.beat,
              `(${tick})`,
              'time signature:', timeSignature.count, '/', timeSignature.division);
        } else {
          // do no keep unknown events
          log('channel', 'master',
              'bar', bar, '>', display.bar,
              'beat', beat, '>', display.beat,
              `(${tick})`,
              'event', event);
        }

      } else if(trackChange) {
        const part = partSet.selectOrCreate({track: t, channel, instrument});

        if(noteChange) {
          const pitch = event.getNote();
          const intensity = event.getVelocity();
          const type = (event.isNoteOff() || intensity === 0
                        ? 'noteOff'
                        : 'noteOn');

          if(type === 'noteOn') {
            if(notesRunning[channel].has(pitch) ) {
              log('######## insert note off');

              // insert a note off to avoid overlapping notes with same pitch
              part.events.push(new Note({
                channel,
                type: 'noteOff',
                tick,
                pitch,
                intensity: 0,
              }));
              notesRunning[channel].delete(pitch);

              log('channel', channel,
                  'bar', bar, '>', display.bar,
                  'beat', beat, '>', display.beat,
                  `(${tick})`,
                  'noteOff',
                  'pitch', pitch,
                  'intensity', 0);
            }

            const note = new Note({
              channel,
              type,
              tick,
              pitch,
              intensity,
            });
            part.events.push(note);
            notesRunning[channel].set(pitch);

            log('channel', channel,
                'bar', bar, '>', display.bar,
                'beat', beat, '>', display.beat,
                `(${tick})`,
                type,
                'pitch', pitch,
                'intensity', intensity);
          } else {
            // noteOff

            // ignore non-running notes
            if(notesRunning[channel].has(pitch) ) {
              const note = new Note({
                channel,
                type,
                tick,
                pitch,
                intensity: 0,
              });
              part.events.push(note);
              notesRunning[channel].delete(pitch);

              log('channel', channel,
                  'bar', bar, '>', display.bar,
                  'beat', beat, '>', display.beat,
                  `(${tick})`,
                  type,
                  'pitch', pitch,
                  'intensity', intensity);
            }
          }

        } else if (programChange) {
          instrument = event[1];
          if(typeof part.instrument === 'undefined') {
            part.instrument = instrument;
          }

          const type = 'instrument';
          part.events.push(new Event({
            channel,
            type,
            tick,
            data: instrument,
          }));

          log('channel', channel,
              'bar', bar, '>', display.bar,
              'beat', beat, '>', display.beat,
              `(${tick})`,
              type,
              instrument, display.event);
        } else if (controlChange) {
          const control = event[1];
          const value = event[2];
          let type;
          switch(control) {
            case 7:
              type = 'volume';
              break;

            case 11:
              type = 'expression';
              break;

            case 64:
              type = 'damper';
              break;

            default:
              break;
          }

          if(type) {
            part.events.push(new Event({
              channel,
              type,
              tick,
              data: value,
            }));
          }

          log('channel', channel,
              'bar', bar, '>', display.bar,
              'beat', beat, '>', display.beat,
              `(${tick})`,
              type,
              control, value,
              display.event);
          // 7 volume
          // 11 expression

        } else if (metaChange) {
          if(event.ff) {
            switch(event.ff) {
                // encoding in MIDI file is ANSI or MS-Kanji, see lyrics below

                // Cf. Recommended Practice (RP-026),
                // SMF Language and Display Extensions

                // ANSI is Windows-1252 and should be a subset of Latin-1

              case 1:
                // text event
                break;
              case 2:
                // copyright
                break;
              case 3:
                // sequence/track name

                // Latin-1 to UTF-8 conversion
                name = decodeURIComponent(escape(event.dd));
                // remove control characters
                name = name.replace(/[\t\r\n\v\f\0]/g, '');
                part.name = name;
                break;
              case 4:
                // instrument name
                break;
              case 5:
                // lyric
                // @TODO: parse {@<code_set>} for text encoding
                break;
              case 6:
                // marker
                break;
              case 7:
                // cue point
                break;
              case 20:
                // channel
                break;
              case 47:
                // end of track
                break;
              default:
                break;
            }
          }

        } else {
          log('channel', channel,
              'bar', bar, '>', display.bar,
              'beat', beat, '>', display.beat,
              `(${tick})`,
              'event', display.event);
        }
      }

    } // for each midi event

  } // for each track

  log('#### Master track', masterTrack.events.length);
  masterTrack.events.forEach( (event) => {
    log('channel', 'master',
        'bar', event.bar,
        'beat', event.beat,
        `(${event.tick})`,
        event.type,
        event.data);

  });

  partSet.removeEmpty();

  log('#####', partSet.length(), 'parts');
  partSet.forEach(part => {
    log('track', part.track, part.events.length, 'events');
  });


  // Assign bars and beats to each part
  partSet.forEach(part => {
    log('track', part.track,
        'channel', part.channel,
        'name', part.name,
        'instrument', part.instrument);

    let timeSignature = masterTrack.timeSignature;
    const ppqn = masterTrack.ppqn;
    let masterE = 0;
    let masterEvent = (masterTrack.events.length > 0
                       ? masterTrack.events[0]
                       : {tick: 0, bar: 1, beat: 1});
    part.events.forEach( (event) => {
      const tick = event.tick;
      while(masterE + 1 < masterTrack.events.length
            && masterTrack.events[masterE + 1].tick <= event.tick) {
        ++masterE;
        masterEvent = masterTrack.events[masterE];
        log('channel', 'master',
            'bar', masterEvent.bar,
            'beat', masterEvent.beat,
            `(${masterEvent.tick})`,
            masterEvent.type, masterEvent.data);
        if(masterEvent.type === 'timeSignature') {
          timeSignature = masterEvent.data;
        }
      }

      const {bar, beat} = barBeatAdvance({
        ppqn,
        timeSignature,
        last: masterEvent,
        tick: event.tick,
      });
      Object.assign(event, {bar, beat});

      if(event.type === 'noteOn' || event.type === 'noteOff') {
        log('channel', event.channel,
            'bar', event.bar,
            'beat', event.beat,
            `(${tick})`,
            event.type, event.data);
      }

    });

  });

  // should we remove unused data: ticks, channels, etc.

  return {masterTrack, partSet};
}

/************ helpers **********/

function barBeatAdvance({ppqn, timeSignature, last, tick}) {
  const tickDelta = tick - last.tick;

  // resolution per quarter note
  // do not round to avoid drift
  const beatDelta = tickDelta / ppqn * timeSignature.division / 4;

  // modulo shifted by 1, for bar starting at 1
  const beat = (last.beat + beatDelta - 1 + timeSignature.count)
        % timeSignature.count + 1;

  // lastChange.beat is start offset from lastChange.bar
  // duration starts from beat 1
  const barDelta = ((last.beat - 1 + beatDelta) / timeSignature.count);

  const bar = Math.floor(last.bar + barDelta);

  return {tick, bar, beat};
}

/********** debug *************/

const logEnable = false;
function log() {
  if(logEnable) {
    console.log(...arguments);
  }
}

function pad(prefix, radical) {
  const string = (typeof radical === 'string'
                  ? radical
                  : radical.toString() );

  const slice = (string.length > prefix.length
                 ? prefix.length
                 : -prefix.length);
  return (prefix + string).slice(slice);
}

function hexadecimalAndDecimal(number) {
  return `0x${pad('00', number.toString(16).toUpperCase())} (${number})`;
}

// Do not round, except for display
function beatRound(value, timeSignature = {count: 4, division: 4},
                   ppqn = 1024) {
  const resolution = ppqn * 4 / timeSignature.division;
  return Math.round(value * resolution) / resolution;
}

function barBeatRound(bar, beat, timeSignature = {count: 4, division: 4},
                      ppqn = 1024) {
  let beatRounded = beatRound(beat, timeSignature, ppqn);
  const barExtra = (Math.floor(beatRounded) > timeSignature.count
                    ? 1
                    : 0);
  let barRounded = bar;
  // next bar
  if (barExtra > 0) {
    ++barRounded;
    beatRounded = 1;
    log('######### add bar');
  }
  return {
    bar: barRounded,
    beat: beatRounded,
  };
}

function roundFixed(value, decimals = 0) {
  return parseFloat(value.toFixed(decimals) );
}

