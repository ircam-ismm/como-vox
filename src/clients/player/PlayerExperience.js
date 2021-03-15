import { AbstractExperience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';

import {EventEmitter} from 'events'; // node.js or babel
import {Blocked} from '@ircam/blocked';

import url from '../shared/url.js';
import schema from '../../shared/schema.js';
import CoMoPlayer from '../como-helpers/CoMoPlayer';
import views from '../como-helpers/views-mobile/index.js';

import midi from '../../shared/score/midi.js';

import {SampleManager} from '../shared/SampleManager.js';

// window.app from CoMoPlayer
const app = window.app;
const conversion = app.imports.helpers.conversion;
const beatsToSeconds = conversion.beatsToSeconds;
const notesToBeats = conversion.notesToBeats;
const notesToSeconds = conversion.notesToSeconds;
const positionAddBeats = conversion.positionAddBeats;

const audio = app.imports.helpers.audio;

if(typeof app.instruments === 'undefined') {
  app.instruments = {};
}

const beatingSoundDefault = false;
const lookAheadNotesDefault = 0.125; // 1 quarter-note
const metronomeSoundDefault = false;
const positionDefault = {bar: 1, beat: 1};
const tempoDefault = 80;
const timeSignatureDefault = {count: 4, division: 4};
const playbackDefault = true;

if(typeof app.data === 'undefined') {
  app.data = {};
}

Object.assign(app.data, {
  playbackLatency: notesToSeconds(lookAheadNotesDefault, {
    tempo: tempoDefault,
  }),
  lookAheadNotes: lookAheadNotesDefault,
  lookAheadBeats : notesToBeats(lookAheadNotesDefault, {
    timeSignature: timeSignatureDefault,
  }),
  lookAheadSeconds: notesToSeconds(lookAheadNotesDefault, {
    tempo: tempoDefault,
  }),
  position: positionDefault,
  playback: playbackDefault,
  tempo: tempoDefault,
  time: {
    audio: 0,
    performance: 0,
  },
  timeSignature: timeSignatureDefault,
});

app.events = new EventEmitter();
app.events.setMaxListeners(0);
if(typeof app.state === 'undefined') {
  app.state = {};
}

// for simple debugging in browser...
const MOCK_SENSORS = url.paramGet('mockSensors', false);
console.info('> to mock sensors for debugging purpose, append "?mockSensors=1" to URL');
console.info('> mock-sensors', MOCK_SENSORS);

const DEBUG_AUDIO = (url.paramGet('debugAudio', false)
                     ? true : false);
console.info('> to use audio for debugging purpose, append "?debugAudio=1" to URI');
console.info('> debugAudio', DEBUG_AUDIO);

const UI_PRESET = url.paramGet('uiPreset', 'simple');
console.info('> for full interface, append "?uiPreset=full" to URI');
console.info('> uiPreset', UI_PRESET);

class PlayerExperience extends AbstractExperience {
  constructor(como, config, $container) {
    super(como.client);

    this.como = como;
    this.config = config;
    this.$container = $container;

    this.sync = this.require('sync');
    this.rafId = null;

    this.player = null;
    this.session = null;

    this.events = app.events;
    this.state = app.state;
    this.stream = app.data;

    this.voxApplicationState = null;
    this.voxPlayerState = null;

    this.position = positionDefault;

    this.playback = playbackDefault;

    this.tempo = tempoDefault;
    this.tempoReference = tempoDefault;
    this.timeSignature = timeSignatureDefault;

    // default values

    // in beats, not taking account of audioLatency
    this.lookAheadNotes = lookAheadNotesDefault;
    // in seconds, taking audioLatency into account
    this.lookAheadSeconds = undefined;

    // in seconds
    // @TODO discover and store in localStorage
    this.audioLatency = 0;

    this.metronomeSound = undefined;
    this.beatingSound = undefined;

    app.experience = this;

    // configure como w/ the given experience
    this.como.configureExperience(this);
    // default initialization views
    renderInitializationScreens(como.client, config, $container);
  }

  async start() {
    super.start();
    // console.log('hasDeviceMotion', this.como.hasDeviceMotion);

    this.voxApplicationState = await this.client.stateManager.attach('vox-application');
    this.voxApplicationState.subscribe( (updates) => {
      // ...
    })

    // 1. create a como player instance w/ a unique id (we default to the nodeId)
    const player = await this.como.project.createPlayer(this.como.client.id);
    this.voxPlayerState = await this.client.stateManager.create('vox-player');
    this.initialiseState();

    const voxPlayerSchema = this.voxPlayerState.getSchema();
    url.parse(voxPlayerSchema);


    this.voxPlayerState.subscribe(async (updates) => {
      for (let [key, value] of Object.entries(updates) ) {
        this.updateFromState(key, value);
      }
    });

    // 2. create a sensor source to be used within the graph.
    // We create a `RandomSource` if deviceMotion is not available for development
    // purpose, in most situations we might prefer to display a "sorry" screen
    let source;
    // @todo - finish decoupling `streamId` from `playerId`
    if (this.como.hasDeviceMotion) {
      source = new this.como.sources.DeviceMotion(this.como, player.get('id'));
    } else {
      source = new this.como.sources.RandomValues(this.como, player.get('id'));
    }

    // @example - metas is a placeholder for application specific informations
    // player.set({
    //   metas: {
    //     index: this.services.checkin.state.get('index'),
    //     label: `niap-${this.services.checkin.state.get('index')}`,
    //   }
    // });

    // 3. bind everything together, the CoMoPlayer abstraction is just a shortcut
    // for binding player, sessions, and graph, triggering subscriptions when
    // anything change.
    this.coMoPlayer = new CoMoPlayer(this.como, player);
    app.player = this.coMoPlayer;

    this.coMoPlayer.setSource(source);

    this.audioContext = this.como.audioContext;

    const baseUrl = url.base
          + '/soundfonts/acoustic_grand_piano';
    // + '/soundfonts/bright_acoustic_piano';

    this.pianoSampleManager = new SampleManager({
      audioContext: this.audioContext,
      baseUrl,
    });
    app.instruments.pianoSampleManager = this.pianoSampleManager;

    // 4. react to gui controls.
    this.listeners = {
      // this one is needed for the enableCreation option
      createSession: async (sessionName, sessionPreset) => {
        const sessionId = await this.como.project.createSession(sessionName, sessionPreset);
        return sessionId;
      },
      setPlayerParams: async updates => await this.coMoPlayer.player.set(updates),
      // these 2 ones are only for the designer...
      // 'clearSessionExamples': async () => this.coMoPlayer.session.clearExamples(),
      // 'clearSessionLabel': async label => this.coMoPlayer.session.clearLabel(label),

    };


    // subscribe for updates to render views
    this.coMoPlayer.onChange(() => this.render());
    // if we want to track the sessions that are created and deleted
    // e.g. when displaying the session choice screen
    this.como.project.subscribe(() => this.render());


    // @note - prevent session choice for development
    await this.coMoPlayer.player.set({ sessionId: 'test' });

    // quick and drity fix...
    this.coMoPlayer.onGraphCreated(async () => {
      app.graph = this.coMoPlayer.graph;

      this.seekPosition(positionDefault);

      this.coMoPlayer.graph.modules['bridge'].subscribe(frame => {
        this.position = frame['position'];
        this.playback = frame['playback'];

        const score = frame['score'];
        if(this.state.scoreControlsTempo && score && score.tempo) {
          this.events.emit('tempo', score.tempo);
        } else {
          // internal stream: no propagation of update
          this.setTempo(frame['tempo'], {referenceUpdate: false});
        }

        if(this.state.scoreControlsTimeSignature) {
          if(score && score.timeSignature) {
            this.events.emit('timeSignature', score.timeSignature);
          }
        } else {
          // internal stream: no propagation of update
          this.setTimeSignature(frame['timeSignature']);
        }

        this.updateLookAhead({allowMoreIncrement: 0});
      });
    });

    this.events.emit('debugAudio', DEBUG_AUDIO);
    this.uiPreset = UI_PRESET;
    this.events.emit('uiPreset', UI_PRESET);

    window.addEventListener('resize', () => this.render());

    const updateClock = () => {
      this.render();
      this.rafId = window.requestAnimationFrame(updateClock);
    };

    this.rafId = window.requestAnimationFrame(updateClock);
  }

  updateFromState(key, value) {
    const voxPlayerSchema = this.voxPlayerState.getSchema();
    const event = voxPlayerSchema[key].event;

    if(event || JSON.stringify(value) !== JSON.stringify(this.state[key] ) ) {
      app.events.emit(key, value);
    }

  }

  // immediate to data and asynchronously to voxPlayerState
  updateFromEvent(key, value) {
    const voxPlayerSchema = this.voxPlayerState.getSchema();
    const event = schema.isEvent(voxPlayerSchema, key);
    const shared = schema.isShared(voxPlayerSchema, key);

    this.state[key] = value;

    // do not forward local events to shared state
    if(!event && shared
       && JSON.stringify(value) !== JSON.stringify(this.voxPlayerState.get(key) ) ) {
      this.voxPlayerState.set({[key]: value});
    }
  }

  // declare everything if voxPlayerSchema
  initialiseState() {
    for(const [key, value] of Object.entries(this.voxPlayerState.getValues() ) ) {
      this.state[key] = value;
      switch(key) {

        case 'debugAudio': {
          this.events.on(key, (value) => {
            this.updateFromEvent(key, value);
            this.setDebugAudio(value);
          });
          break;
        }

        case 'audioLatency': {
          this.events.on(key, (value) => {
            this.updateFromEvent(key, value);
            this.setAudioLatency(value);
          });
          break;
        }

        case 'lookAheadNotes': {
          this.events.on(key, (value) => {
            this.updateFromEvent(key, value);
            this.setLookAheadNotes(value);
          });
          break;
        }

        case 'record': {
          this.events.on(key, (value) => {
            if (value && this.coMoPlayer && this.coMoPlayer.graph) {
              // this.coMoPlayer.graph.modules['bridge'].addListener(frame => {
              //   // console.log(frame);
              // });
              this.updateFromEvent(key, value);
            } else {
              // do not update from event
              this.events.emit('record', false);
            }
          });
          break;
        }

        case 'scoreFileName': {
          this.events.on(key, async (value) => {
            this.updateFromEvent(key, value);
            let scoreURI;
            const scoreURIbase = this.state[key];
            if(!scoreURIbase || scoreURIbase === 'none') {
              scoreURI = null;
            } else {
              scoreURI = url.base
                + '/'
                + this.voxApplicationState.get('scoresPath')
                + '/'
                + scoreURIbase;
            }
            try {
              await this.setScore(scoreURI)
            } catch (error) {
              console.error('Error while loading score: ' + error.message);
            }
          });
          break;
        }

        case 'playback': {
          this.events.on(key, (value) => {
            this.updateFromEvent(key, value);
            this.setPlayback(value);
          });
          break;
        }

        case 'tempo': {
          this.events.on(key, (value) => {
            this.updateFromEvent(key, value);
            this.setTempo(value, true);
          });
          break;
        }

        case 'tempoReset': {
          this.events.on(key, (value) => {
            this.resetTempo();
          });
          break;
        }

        case 'timeSignature': {
          this.events.on(key, (value) => {
            this.updateFromEvent(key, value);
            this.setTimeSignature(value);
          });
          break;
        }

        default: {
          this.events.on(key, (value) => {
            this.updateFromEvent(key, value);
          });
          break;
        }
      }
    }
  }

  setGraphOptions(node, updates) {
    if(this.coMoPlayer && this.coMoPlayer.graph
       && this.coMoPlayer.graph.modules[node]) {
      this.coMoPlayer.player.setGraphOptions(node, updates);
    }
  }

  async setScore(scoreURI) {
    if(!scoreURI) {
      this.events.emit('scoreData', null);
      this.events.emit('scoreReady', true);

      // do not delete notes of previously loaded score
      return Promise.resolve(null);
    }

    const promise = new Promise( (resolve, reject) => {
      this.events.emit('scoreReady', false);
      this.events.emit('scoreData', null);

      const request = new window.XMLHttpRequest();
      request.open('GET', scoreURI, true);
      request.responseType = 'arraybuffer'; // binary data

      request.onerror = () => {
        reject(new Error(`Unable to GET ${scoreURI}, status ${request.status}`) );
      };

      request.onload = async () => {
        if (request.status < 200 || request.status >= 300) {
          request.onerror();
          return;
        }

        try {
          const scoreData = midi.parse(request.response);
          // no duplicates in set
          const notes = new Set();
          scoreData.partSet.forEach( (part, p) => {
            part.events.forEach( (event) => {
              if(event.type === 'noteOn') {
                notes.add(event.data.pitch);
              }
            });
          });

          await this.pianoSampleManager.update({notes});

          this.events.emit('scoreData', scoreData);
          this.events.emit('scoreReady', true);
          resolve(this.scoreData);
        } catch (error) {
          reject(new Error(`Error with midi file ${scoreURI}: `
                           + error.message) );
        }
      };

      this.events.emit('scoreReady', false);
      this.events.emit('scoreData', null);
      request.send(null);
    });

    return promise;
  }

  setAudioLatency(audioLatency) {
    this.audioLatency = audioLatency;
    this.updateLookAhead();
  }

  setLookAheadNotes(lookAheadNotes) {
    this.lookAheadNotes = lookAheadNotes;
    app.data.lookAheadNotes = lookAheadNotes;

    this.updateLookAhead();
  }

  updateLookAhead({
    allowMoreIncrement = 0.25,
  } = {}) {
    const lookAheadSecondsLast = this.lookAheadSeconds;

    if(this.lookAheadNotes === 0) {
      this.lookAheadBeats = 0;
      app.data.lookAheadBeats = 0;
      this.lookAheadSeconds = 0;
      app.data.lookAheadSeconds = 0;
    } else {
      if(allowMoreIncrement) {
        while(
          (this.lookAheadSeconds = notesToSeconds(this.lookAheadNotes, {
            tempo: this.tempo,
            timeSignature: this.timeSignature,
          })
           - this.audioLatency)
            <= this.lookAheadSecondsMin) {
          this.lookAheadNotes += allowMoreIncrement;
        }
      } else {
        this.lookAheadSeconds = notesToSeconds(this.lookAheadNotes, {
          tempo: this.tempo,
          timeSignature: this.timeSignature,
        })
          - this.audioLatency;
      }
    }

    app.data.lookAheadSeconds = this.lookAheadSeconds;

    this.lookAheadBeats = notesToBeats(this.lookAheadNotes, {
      timeSignature: this.timeSignature,
    });
    app.data.lookAheadBeats = this.lookAheadBeats;

    app.data.playbackLatency = notesToSeconds(this.lookAheadNotes, {
      tempo: this.tempo,
    });
  }

  setTempo(tempo, {
    referenceUpdate = true,
  } = {}) {
    if(!tempo || (tempo === this.tempo && tempo == this.tempoReference) ) {
      return;
    }

    if(referenceUpdate) {
      this.tempoReference = tempo;
    }

    this.tempo = tempo;

    app.data.tempo = tempo;
    this.updateLookAhead();
  }

  resetTempo() {
    this.events.emit('tempo', this.tempoReference);
  }

  setTimeSignature(timeSignature) {
    // object equal
    if(!timeSignature
       || (JSON.stringify(this.timeSignature)
           === JSON.stringify(timeSignature) ) ) {
      return;
    }

    this.timeSignature = timeSignature;
    app.data.timeSignature = timeSignature;
    this.updateLookAhead();
  }

  seekPosition(position) {
    this.events.emit('seekPosition', position);
  }

  setPlayback(playback) {
    this.playback = playback;

    if(!playback) {
      this.seekPosition({
        bar: app.data.position.bar,
        beat: 1,
      });
    }
  }

  setDebugAudio(enabled) {
    if(!enabled) {
      if(this.debugAudioHandler) {
        this.debugAudioHandler.stop();
      }
      this.debugAudioHandler = null;
      return;
    }

    const noiseBuffer = audio.generateNoiseBuffer({
      audioContext: this.audioContext,
      duration: 1, // seconds,
      gain: -30, // dB
    });

    this.debugAudioHandler = new Blocked( (duration) => {
      console.warn(`---------- blocked for ${duration} ms ---------`);
      audio.playBuffer(noiseBuffer, {
        audioContext: this.audioContext,
        duration: duration * 1e-3,
      });
    }, 50);
  }

  render() {
    const syncTime = this.sync.getSyncTime();

    // warning: syncTime is NOT compensated
    const positionCompensated = positionAddBeats(this.position, -this.lookAheadBeats,
                                                 {timeSignature: this.timeSignature});

    const viewData = this.state;

    Object.assign(viewData, {
      boundingClientRect: this.$container.getBoundingClientRect(),
      config: this.config,
      experience: this,
      lookAheadBeats: this.lookAheadBeats,
      lookAheadSeconds: this.lookAheadSeconds,
      player: this.coMoPlayer.player.getValues(),
      position: this.position,
      project: this.como.project.getValues(),
      session: (this.coMoPlayer.session
                ? this.coMoPlayer.session.getValues()
                : null),
      syncTime,
      tempo: this.tempo, // override state tempo which is reference tempo
      voxApplicationState: this.voxApplicationState,
      voxPlayerState: this.voxPlayerState,
    });

    const listeners = this.listeners;

    let screen = ``;

    if (!this.como.hasDeviceMotion && !MOCK_SENSORS) {
      screen = views.sorry(viewData, listeners);
    } else if (this.coMoPlayer.session === null) {
      screen = views.manageSessions(viewData, listeners, {
        enableCreation: false,
        enableSelection: true,
      });
    } else {
      screen = views[this.client.type](viewData, listeners, {
        verbose: false,
        enableSelection: false,
      });
    }

    render(html`
      <div style="
        box-sizing: border-box;
        width: 100%;
        min-height: 100%;
        padding: 20px;
      ">
        ${screen}
      </div>
    `, this.$container);
  }
}

export default PlayerExperience;
