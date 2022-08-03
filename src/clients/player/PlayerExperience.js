import { AbstractExperience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';

import {EventEmitter} from 'events'; // node.js or babel
import {Blocked} from '@ircam/blocked';

import log from '../shared/log.js';
import url from '../shared/url.js';
import schema from '../../shared/schema.js';
import storage from '../shared/storage.js';
import CoMoPlayer from '../como-helpers/CoMoPlayer';
import views from '../como-helpers/views-mobile/index.js';
import { playerElectron } from '../como-helpers/views-electron/playerElectron.js';
import * as CoMoteQRCode from '@ircam/comote-helpers/qrcode.js';

views.playerElectron = playerElectron;

import midi from '../../shared/score/midi.js';
import { SampleManager } from '../shared/SampleManager.js';
// in case of electron app
import ComoteSource from './electron/ComoteSource.js';
import { tempoChangeBeatingUnit } from '../../server/helpers/conversion.js';

// window.app from CoMoPlayer
const app = window.app;
const conversion = app.imports.helpers.conversion;
const beatsToSeconds = conversion.beatsToSeconds;
const notesToBeats = conversion.notesToBeats;
const notesToSeconds = conversion.notesToSeconds;
const positionAddBeats = conversion.positionAddBeats;
const positionChangeBeatingUnit = conversion.positionChangeBeatingUnit;

const audio = app.imports.helpers.audio;

if (typeof app.instruments === 'undefined') {
  app.instruments = {};
}

if (typeof app.measures === 'undefined') {
  app.measures = {};
}

const beatingSoundDefault = false;
const lookAheadNotesDefault = 1/8; // 1 eighth-note
const metronomeSoundDefault = false;
const positionDefault = {bar: 1, beat: 1};
const tempoDefault = 80;
const timeSignatureDefault = {count: 4, division: 4};
const playbackDefault = true;

if (typeof app.data === 'undefined') {
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
  // try to avoid jitter with some look-ahead
  lookAheadSecondsMin: 100e-3,
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
console.info('> to mock sensors for debugging purpose, append "&mockSensors=1" to URI');
console.info('> to use audio for debugging purpose, append "&debugAudio=1" to URI');
console.info('> to use advanced graphical user interface for debugging purpose, append "&editorGUI=1" to URI');

let PLAYER_PROD = !url.paramGet('editorGUI', null);
let PLAYER_ELECTRON = url.paramGet('target', false) == 'electron' ? true : false;

console.log("load: PLAYER_PROD = ", PLAYER_PROD);
console.log("load: PLAYER_ELECTRON = ", PLAYER_ELECTRON);

class PlayerExperience extends AbstractExperience {
  constructor(como, config, $container) {
    super(como.client);

    this.como = como;
    this.config = config;
    this.$container = $container;

    this.sync = this.require('sync');
    this.logger = this.require('vox-logger');
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
    this.lookAheadNotesRequest = lookAheadNotesDefault;
    this.lookAheadNotes = lookAheadNotesDefault;
    // in seconds, taking audioLatency into account
    this.lookAheadSeconds = undefined;
    this.lookAheadSecondsMin = app.data.lookAheadSecondsMin;

    // in seconds
    this.audioLatency = 0;

    this.metronomeSound = undefined;
    this.beatingSound = undefined;

    // to avoid freezing phone the stack is clamped to 6000 values (~2mn), see `setTempo`
    this.tempoStack = [];
    this.tempoStats = {};

    app.experience = this;

    // configure como w/ the given experience
    this.como.configureExperience(this);
    // default initialization views

    if (!PLAYER_PROD && !PLAYER_ELECTRON) {
      renderInitializationScreens(como.client, config, $container);
    } else {
      renderInitializationScreens(como.client, config, $container, {
        screens: {
          platform: (platform, config, containerInfos) => {
            const pluginState = platform.state.getValues();

            let msg;
            let bindListener = undefined;
            let blink = false;

            if (pluginState.available === null) {
              msg = 'Vérification...';
            } else if (pluginState.authorized === null) {
              msg = 'Autorisations...';
            } else if (pluginState.initializing === null) {
              msg = `Cliquez pour commencer`;

              // only for web mobile version
              if (!PLAYER_ELECTRON) {
                msg += `<span>Merci d'accepter l'utilisation<br />des capteurs de mouvement</span>`;
              }

              blink = true;

              bindListener = (e) => {
                e.preventDefault();
                platform.onUserGesture(e);
              }
            } else if (pluginState.initialized === null) {
              msg = 'Initialisation...'
            } else if (pluginState.finalized === null) {
              msg = 'Finalisation...'
            }

            return html`
              <section id="home" @click="${bindListener}">
                <div class="logo"></div>
                <svg class="button" viewbox="0 0 100 100">
                  <polygon class="play-shape" points="30,20, 80,50, 30,80"></polygon>
                </svg>
                <p>${unsafeHTML(msg)}</p>
              </section>
            `;
          },
          default: (plugin, config, containerInfos) => {
            return html`
              <section id="home">
                <div class="logo"></div>
                <svg class="button" viewbox="0 0 100 100">
                  <polygon class="play-shape" points="30,20, 80,50, 30,80"></polygon>
                </svg>
                <p>Chargement de l'application...</p>
              </section>
            `;
          }
        },
      });
    }
  }

  async start() {
    await super.start();

    this.logWriter = await this.logger.create(`client-${this.como.client.id}.txt`);
    this.log(`navigator.userAgent: ${navigator.userAgent}`);
    this.log(`navigator.userAgentData: ${JSON.stringify(navigator.userAgentData)}`);

    window.addEventListener('error', (err) => {
      // https://developer.mozilla.org/en-US/docs/Web/API/ErrorEvent
      let msg = `${err.message} ${err.filename}:${err.lineno}`;
      this.log(msg);
    });

    // playerProd only
    this.guiState = {
      showAdvancedSettings: false,
      showCalibrationScreen: false,
      showCreditsScreen: false,
      showInvalidSensorFramerateScreen: false,
      showTempoStats: false,
      showTip: null, // 'locked-exercise'

      // abuse the gui state to be able to have the filename of a dropped midi file
      // this is really dirty...
      electron: {
        droppedMidiFile: null,
      }
    };

    // debug tempo stats.....
    // for (let i = 0; i < 1000; i++) {
    //   this.tempoStack.push(Math.random() * 30 + 60);
    // }
    // this.doTempoStats();
    // this.guiState.showTempoStats = true;
    // end debug.............

    this.voxApplicationState = await this.client.stateManager.attach('vox-application');
    this.voxApplicationState.subscribe( (updates) => {
      // ...
    });

    // 1. create a como player instance w/ a unique id (we default to the nodeId)
    const player = await this.como.project.createPlayer(this.como.client.id);
    this.voxPlayerState = await this.client.stateManager.create('vox-player');
    this.initialiseState();

    const voxPlayerSchema = this.voxPlayerState.getSchema();

    this.voxPlayerState.subscribe(async (updates) => {
      for (let [key, value] of Object.entries(updates) ) {
        this.updateFromState(key, value);
      }

      // update URL on state change, to avoid update for each parameter
      url.update(voxPlayerSchema, this.state);

      if ('scenarioPlayback' in updates) {
        if (!updates.scenarioPlayback) {
          // only show stats when it make sens
          if (this.state.scenarioCurrent === 'scenarioTempo' ||
            this.state.scenarioCurrent === 'scenarioTempoIntensity'
          ) {
            this.doTempoStats();
            this.guiState.showTempoStats = true;
          }
        } else {
          this.tempoStack.length = 0; // reset stack
        }
      }
    });

    // 2. create a sensor source to be used within the graph.
    // We create a `RandomSource` if deviceMotion is not available for development
    // purpose, in most situations we might prefer to display a "sorry" screen
    let source;

    if (PLAYER_ELECTRON) {
      this.comoteState = await this.client.stateManager.attach('comote');
      source = new ComoteSource(this.como, player.get('id'));

      this.comoteState.subscribe(async updates => {
        for (let [key, value] of Object.entries(updates)) {
          switch (key) {
            case 'devicemotion':
              source.process(updates.devicemotion);
              break;
            case 'connected': {
              // stop every that could play on disconnection
              if (value === false) {
                this.voxPlayerState.set({ scenarioListening: false });
                this.voxPlayerState.set({ scenarioPlayback: false });
              }
              this.render();
              break;
            }
            case 'config': {
              console.log('> new network config received');
              this.qrCode = await CoMoteQRCode.dataURL(this.comoteState.get('config'));
              this.render();
              break;
            }
            case 'buttonA': {
              if (value == true) {
                const $btns = Array.from(document.querySelectorAll('.exercise'));
                const indexSelected = $btns.findIndex($btn => $btn.classList.contains('selected'));
                const nextIndex = indexSelected !== -1 ? (indexSelected + 1) % $btns.length : 0;
                const $nextBtn = $btns[nextIndex];
                $nextBtn.click();
              }
              break;
            }
            case 'buttonB': {
              if (value == true) {
                let playback = this.voxPlayerState.get('scenarioPlayback');
                this.voxPlayerState.set({ scenarioPlayback: !playback });
              }
              break;
            }
          }
        }
      });
      // init QRCode
      this.qrCode = await CoMoteQRCode.dataURL(this.comoteState.get('config'));
    } else if (this.como.hasDeviceMotion) {
      source = new this.como.sources.DeviceMotion(this.como, player.get('id'));
    } else {
      source = new this.como.sources.RandomValues(this.como, player.get('id'));
    }

    this.source = source;

    console.log('> hasDeviceMotion', this.como.hasDeviceMotion);
    let errorFlag = false;

    const sensorTest = e => {
      source.removeListener(sensorTest); // this doesn't work...
      // do not allow frame rate higher than 20ms
      if (e.metas.period > 0.02 && !this.state['mockSensors'] && !errorFlag) {
        console.log('Invalid Sensor Rate', e.metas.period);
        this.guiState.showInvalidSensorFramerateScreen = true;
        this.render();

        let msg = `Aborting: sensors framerate is ${e.metas.period}s`;
        this.log(msg);

        errorFlag = true;
      }
    };

    source.addListener(sensorTest);

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

    for (const key of Object.keys(voxPlayerSchema) ) {
      if (schema.isStored(voxPlayerSchema, key)) {
        const value = storage.load(key);

        if (typeof value !== 'undefined') {
          this.events.emit(key, value);
        }
      }
    }

    const loadedState = await url.parse(voxPlayerSchema);
    console.log("loadedState = ", loadedState);

    // be sure to restore tempo and beatingUnit after a load
    // no matter the modes
    if (typeof loadedState.tempo !== 'undefined'
       || typeof loadedState.beatingUnit) {
      const {tempo, beatingUnit} = loadedState;

      this.setScoreCallback = () => {
        if (tempo) {
          this.events.emit('tempo', tempo);
        }

        if (beatingUnit) {
          this.events.emit('beatingUnit', beatingUnit);
        }

        delete this.setScoreCallback;
      }
    }

    for (const [key, value] of Object.entries(loadedState) ) {
      this.events.emit(key, value);
    }

    // soundfonts/bright_acoustic_piano
    this.pianoSampleManager = new SampleManager({
      audioContext: this.audioContext,
      baseUrl: `${url.base}/soundfonts/acoustic_grand_piano`,
    });
    app.instruments.pianoSampleManager = this.pianoSampleManager;

    this.speechSampleManager = new SampleManager({
      audioContext: this.audioContext,
      baseUrl: `${url.base}/speech/aurelie`,
    });
    app.instruments.speechSampleManager = this.speechSampleManager;

    await this.speechSampleManager.update({
      notes: [
        'annule',
        'c_est_a_vous',
        'erreur',
        'merci',
        'pas_assez_regulier',
        'trop_lent',
        'trop_rapide',
      ],
    });

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

    app.graph = this.coMoPlayer.graph;

    this.seekPosition(positionDefault);

    this.coMoPlayer.graph.modules['bridge'].subscribe(frame => {
      this.position = frame['position'];
      this.playback = frame['playback'];

      const score = frame['score'];

      if (this.state.scoreControlsTempo && score && score.tempo) {
        this.events.emit('tempo', score.tempo);
      } else {
        // internal stream: no propagation of update
        this.setTempo(frame['tempo'], {referenceUpdate: false});

        // store values for stats
        if (this.voxPlayerState.get('scenarioPlayback')) {
          if (this.tempoStack.length < 6000) { // around 2 minutes
            const tempo = tempoChangeBeatingUnit(frame['tempo'], {
              timeSignature: this.state.timeSignature,
              beatingUnit: 1/4, // tempo for quarter-note
              beatingUnitNew: this.state.beatingUnit
            });
            this.tempoStack.push(tempo);
          }
        }
      }

      if (this.state.scoreControlsTimeSignature) {
        if (score && score.timeSignature) {
          this.events.emit('timeSignature', score.timeSignature);
        }
      } else {
        // internal stream: no propagation of update
        this.setTimeSignature(frame['timeSignature']);
      }

      this.updateLookAhead({allowMoreIncrement: 0});

      if (score && score.dataChanged) {
        if (typeof this.setScoreCallback === 'function') {
          this.setScoreCallback();
        }
      }
    });

    window.addEventListener('resize', () => this.render());

    if (!PLAYER_PROD) {
      const updateClock = () => {
        this.render();
        this.rafId = window.requestAnimationFrame(updateClock);
      };

      this.rafId = window.requestAnimationFrame(updateClock);
    }

    // update tempo
    setInterval(() => {
      this.render();
    }, 1000);
  }

  log(message) {
    // console.info(`[log] ${message}`);
    this.logWriter.write(`[${log.date()}] ${message}`);
  }

  // playerProd only - might be removed later
  updateGuiState(state) {
    this.guiState = state;
    this.render();
  }

  updateFromState(key, value) {
    const voxPlayerSchema = this.voxPlayerState.getSchema();
    const event = schema.isEvent(voxPlayerSchema, key);

    if(event || JSON.stringify(value) !== JSON.stringify(this.state[key])) {
      app.events.emit(key, value);
    }
    this.render();
  }

  // immediate to data and asynchronously to voxPlayerState
  updateFromEvent(key, value) {
    // console.log('updateFromEvent', key, value);
    const voxPlayerSchema = this.voxPlayerState.getSchema();
    const event = schema.isEvent(voxPlayerSchema, key);
    if(!event) {
      this.state[key] = value;

      const shared = schema.isShared(voxPlayerSchema, key);

      if(shared
         && JSON.stringify(value) !== JSON.stringify(this.voxPlayerState.get(key))) {
        this.voxPlayerState.set({[key]: value});
      }

      const stored = schema.isStored(voxPlayerSchema, key);

      if (stored) {
        storage.save(key, value);
      }
    }
    this.render();
  }

  // declare everything if voxPlayerSchema
  initialiseState() {
    for (const [key, value] of Object.entries(this.voxPlayerState.getValues())) {
      this.state[key] = value;

      switch(key) {
        case 'debugAudio': {
          this.events.on(key, (value) => {
            this.updateFromEvent(key, value);
            this.setDebugAudio(value);
          });
          break;
        }

        case 'audioLatencyMeasured': {
          this.events.on(key, (value) => {
            this.updateFromEvent(key, value);
            this.setAudioLatency();
          });
          break;
        }

        case 'audioLatencyAdaptation': {
          this.events.on(key, (value) => {
            this.updateFromEvent(key, value);
            this.setAudioLatency();
          });

          break;
        }

        case 'beatingUnitMode': {
          this.events.on(key, (value) => {
            this.updateFromEvent(key, value);
            this.updateBeatingUnit();
          });
          break;
        }

        case 'lookAheadNotesRequest': {
          this.events.on(key, (value) => {
            this.updateFromEvent(key, value);
            this.setLookAheadNotesRequest(value);
          });
          break;
        }

        case 'record': {
          this.events.on(key, (value) => {
            if (value && this.coMoPlayer && this.coMoPlayer.graph) {
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
            // dirty hack to be able to have title when drag and drop a midi file
            // scoreFileName should not be able to contain a encoded base64 file
            // this is weird...
            // this is a drag and dropped file, bypass previous logic
            if (this.guiState.electron.droppedMidiFile !== null) {
              // console.log('drop n drop file');
              const scoreURI = this.guiState.electron.droppedMidiFile;
              this.guiState.electron.droppedMidiFile = null;

              this.updateFromEvent(key, value);

              try {
                await this.setScore(scoreURI);
                this.render();
              } catch (error) {
                console.error('Error while loading score: ' + error.message);
              }
            } else {
              // there is a bit too much magic here...
              const name = (value ? value : undefined);
              this.updateFromEvent(key, value);

              const scoreURIbase = this.state[key];
              const urlType = url.type(name);
              let scoreURI;

              if (urlType === 'url'
                  || urlType === 'dataUrl'
                  || urlType === 'blob')
              {
                scoreURI = name;
              } else if (!scoreURIbase || scoreURIbase === 'none') {
                scoreURI = null;
              } else {
                scoreURI = encodeURI(url.base
                                     + '/'
                                     + this.voxApplicationState.get('scoresPath')
                                     + '/'
                                     + scoreURIbase);
              }

              // console.log(scoreURIbase, urlType, scoreURI);
              try {
                await this.setScore(scoreURI);
                this.render();
              } catch (error) {
                console.error('Error while loading score: ' + error.message);
              }
            }
          });
          break;
        }

        case 'storageClear': {
          this.events.on(key, (value) => {
            storage.clear(value);
          });
          break;
        }

        case 'storageClearAll': {
          this.events.on(key, (value) => {
            storage.clearAll();
          });
          break;
        }

        case 'playback': {
          this.events.on(key, (value) => {
            this.updateFromEvent(key, value);
            this.setPlayback(value);
            this.render();
          });
          break;
        }

        case 'playbackStopSeek': {
          this.events.on(key, (value) => {
            this.updateFromEvent(key, value);
            // force stop again to seek
            if(!this.playback) {
              this.setPlayback(this.playback);
            }
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
            this.updateBeatingUnit();
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
    if (!scoreURI) {
      this.events.emit('scoreData', null);
      this.events.emit('scoreReady', true);

      // do not delete notes of previously loaded score
      return Promise.resolve(null);
    }

    const promise = new Promise( async (resolve, reject) => {
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

          if (typeof scoreData.metas === 'undefined') {
            scoreData.metas = {};
          }

          scoreData.metas.noteIntensityMin = 127;
          scoreData.metas.noteIntensityMax = 0;
          scoreData.partSet.forEach( (part, p) => {
            part.events.forEach( (event) => {
              if(event.type === 'noteOn') {
                notes.add(event.data.pitch);
                scoreData.metas.noteIntensityMin
                  = Math.min(scoreData.metas.noteIntensityMin,
                             event.data.intensity);
                scoreData.metas.noteIntensityMax
                  = Math.max(scoreData.metas.noteIntensityMax,
                             event.data.intensity);
              }
            });
          });

          await this.pianoSampleManager.update({notes});

          this.events.emit('scoreData', scoreData);
          this.events.emit('scoreReady', true);
          resolve(this.scoreData);
        } catch (error) {
          reject(new Error(`Error with midi file ${scoreURI}: ${error.message}`));
        }
      };

      request.send(null);
    });

    return promise;
  }

  setAudioLatency() {
    // 10 ms is no so bad as a default value
    const audioLatency = (this.state.audioLatencyMeasured
                          ? this.state.audioLatencyMeasured
                          : 10e-3)
          + this.state.audioLatencyAdaptation;

    this.audioLatency = audioLatency;
    this.events.emit('audioLatency', audioLatency);

    const message = (`audioLatencyMeasured: ${this.state.audioLatencyMeasured}; audioLatencyAdaptation ${this.state.audioLatencyAdaptation}; audioLatency: ${this.audioLatency}`);
    this.log(message);
    this.updateLookAhead();
  }

  setLookAheadNotesRequest(lookAheadNotesRequest) {
    this.lookAheadNotesRequest = lookAheadNotesRequest;

    this.updateLookAhead();
  }

  updateLookAhead({
    allowMoreIncrement = 0.125,
  } = {}) {
    if(this.lookAheadNotesRequest === 0) {
      this.lookAheadNotes = 0;
      app.data.lookAheadNotes = 0;
      if(this.state.lookAheadNotes !== 0) {
        this.events.emit('lookAheadNotes', 0);
      }
      this.lookAheadBeats = 0;
      app.data.lookAheadBeats = 0;
      this.lookAheadSeconds = 0;
      app.data.lookAheadSeconds = 0;
    } else {
      if(allowMoreIncrement) {
        // request value is the minimum
        const {absoluteMax: tempoMax} = this.state.tempoLimits;
        this.lookAheadNotes = this.lookAheadNotesRequest;
        while(
          (this.lookAheadSeconds = notesToSeconds(this.lookAheadNotes, {
            tempo: tempoMax,
            timeSignature: this.timeSignature,
          })
           - this.audioLatency)
            < this.lookAheadSecondsMin) {
          this.lookAheadNotes += allowMoreIncrement;
        }
        app.data.lookAheadNotes = this.lookAheadNotes;
        if(this.state.lookAheadNotes !== this.lookAheadNotes) {
          this.events.emit('lookAheadNotes', this.lookAheadNotes);
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

  updateBeatingUnit() {
    switch(this.state.beatingUnitMode) {
      case 'auto': {
        // medium tempo, easy for beating (andate)
        const tempoTarget = 92;

        // only group those
        const groupableDivisions = [8, 16, 32];

        // try to divide, in order
        const groupableCounts = [3, 2];


        // tempo is always for quarter-note
        const tempo = app.state.tempo * app.state.timeSignature.division / 4;

        if (!groupableDivisions.some( (division) => {
          return app.state.timeSignature.division === division;
        })) {
          //default;
          this.events.emit('beatingUnit', 1 / app.state.timeSignature.division);
          break;
        }

        // if(!app.state.timeSignature.division === 8
        //    && !app.state.timeSignature.division === 16
        //    && !app.state.timeSignature.division === 32) {
        //   this.events.emit('beatingUnit', 1 / app.state.timeSignature.division);
        //   break;
        // }

        if (!groupableCounts.some( (count) => {
          if (app.state.timeSignature.count % count === 0
             && (tempo > app.state.tempoLimits.absoluteMax
                 || (Math.abs((tempo / count) - tempoTarget)
                     < Math.abs(tempo - tempoTarget) ) ) ) {
            this.events.emit('beatingUnit', count / app.state.timeSignature.division);
            return true; // break
          }
          return false; // continue
        })) {
          // default
          this.events.emit('beatingUnit', 1 / app.state.timeSignature.division);
        }

        break;

        // if(app.state.timeSignature.count % 3 === 0) {

        //   if(tempo > app.state.tempoLimits.absoluteMax
        //      || (Math.abs((tempo / 3) - tempoTarget)
        //          < Math.abs(tempo - tempoTarget) ) ) {
        //     this.events.emit('beatingUnit', 3 / app.state.timeSignature.division);
        //     break;
        //   }
        // }

        // if(app.state.timeSignature.count % 2 === 0) {

        //   if(tempo > app.state.tempoLimits.absoluteMax
        //      || (Math.abs((tempo / 2) - tempoTarget)
        //          < Math.abs(tempo - tempoTarget) ) ) {
        //     this.events.emit('beatingUnit', 2 / app.state.timeSignature.division);
        //     break;
        //   }
        // }

        // this.events.emit('beatingUnit', 1 / app.state.timeSignature.division);
        // break;
      }

      case 'timeSignature': {
        this.events.emit('beatingUnit', 1 / app.state.timeSignature.division);
        break;
      }

      case 'fixed': {
        break;
      }

      default: {
        break;
      }

    }
  }

  setTempo(tempo, {
    referenceUpdate = true,
  } = {}) {
    if (!tempo || (tempo === this.tempo && tempo == this.tempoReference)) {
      return;
    }

    if (referenceUpdate) {
      this.tempoReference = tempo;
    }

    this.tempo = tempo;

    app.data.tempo = tempo;
    this.updateLookAhead();
  }

  // just find min max for now
  doTempoStats() {
    let min = +Infinity;
    let max = -Infinity;
    let sum = 0;

    // remove few frames in the beginning, seems that it could be garbage
    for (let i = 0; i < 5; i++) {
      this.tempoStack.shift();
    }

    for (let i = 0; i < this.tempoStack.length; i++) {
      const value = this.tempoStack[i];
      if (value > max) {
        max = value;
      }

      if (value < min) {
        min = value;
      }

      sum += value;
    }

    const mean = sum / this.tempoStack.length;

    this.tempoStats = { min, max, mean };
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
    const playbackChanged = this.playback !== playback;
    this.playback = playback;

    if (playback) {
      if (app.state['measures'] && playbackChanged) {
        app.events.emit('measuresClear', true);
      }
    } else {
      if (app.state['measures'] && playbackChanged) {
        app.events.emit('measuresFinalise', true);
      }
      switch(app.state['playbackStopSeek']) {
        case 'barStart': {
          const {
            timeSignature,
            beatingUnit,
          } = app.state;

          // convert to beating
          const positionBeating = positionChangeBeatingUnit(app.data.position, {
            timeSignature,
            beatingUnitNew: beatingUnit,
          });

          const positionStart = positionChangeBeatingUnit({
            // first bar of beating
            bar: positionBeating.bar,
            beat: 1,
          }, {
            // convert back to position
            timeSignature,
            beatingUnit,
            // no new beating unit to reset
          });
          this.seekPosition(positionStart);
          break;
        }

        case 'start': {
          this.seekPosition({
            bar: 1,
            beat: 1,
          });
          break;
        }

        default: {
          // do not seek (pause)
          break;
        }
      }

    }
  }

  setDebugAudio(enabled) {
    if (!enabled) {
      if (this.debugAudioHandler) {
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

    this.debugAudioHandler = new Blocked((duration) => {
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

    const viewData = {
      ...this.state,
      boundingClientRect: this.$container.getBoundingClientRect(),
      config: this.config,
      experience: this,
      lookAheadNotes: this.lookAheadNotes,
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
      tempoReference: this.tempoReference,
      voxApplicationState: this.voxApplicationState,
      voxPlayerState: this.voxPlayerState,

      // player prod only
      PLAYER_PROD,
      guiState: this.guiState,

      // electron only, undefined otherwise
      comoteState: this.comoteState,
      qrCode: this.qrCode,

      tempoStack: this.tempoStack,
      tempoStats: this.tempoStats,
      // for electron - display some ffedback
      source: this.source,
    };

    const listeners = this.listeners;

    let screen = ``;

    if (!PLAYER_ELECTRON && !this.como.hasDeviceMotion && !this.state['mockSensors']) {
      screen = views.sorry(viewData, listeners);
    } else if (this.guiState.showInvalidSensorFramerateScreen) {
      screen = views.sorryInvalidFrameRate(viewData, listeners);
    } else if (this.coMoPlayer.session === null) {
      if (!PLAYER_PROD) {
        screen = views.manageSessions(viewData, listeners, {
          enableCreation: false,
          enableSelection: !PLAYER_PROD,
        });
      } else {
        screen = html`
          <section id="home">
            <div class="logo"></div>
            <svg class="button" viewbox="0 0 100 100">
              <polygon class="play-shape" points="30,20, 80,50, 30,80"></polygon>
            </svg>
            <p>Chargement de la session...</p>
          </section>
          <footer></footer>
        `
      }
    } else {
      if (PLAYER_ELECTRON) {
        screen = views.playerElectron(viewData, listeners);
      } else if (PLAYER_PROD) {
        screen = views.playerProd(viewData, listeners);
      } else {
        screen = views[this.client.type](viewData, listeners, {
          verbose: false,
          enableSelection: false,
        });
      }
    }

    if (!PLAYER_PROD) {
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
    } else {
      render(screen, this.$container);
    }
  }
}

export default PlayerExperience;
