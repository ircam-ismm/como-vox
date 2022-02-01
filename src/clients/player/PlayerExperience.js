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

if(typeof app.measures === 'undefined') {
  app.measures = {};
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
console.log("load: PLAYER_PROD = ", PLAYER_PROD);

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

    app.experience = this;

    // configure como w/ the given experience
    this.como.configureExperience(this);
    // default initialization views

    if (!PLAYER_PROD) {
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
              msg = `Cliquez pour commencer<span>Merci d'accepter l'utilisation<br />des capteurs de mouvement</span>`;
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
              <footer></footer>
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
              <footer></footer>
            `;
          }
        },
      });
    }
  }

  async start() {
    await super.start();

    this.logWriter = await this.logger.create(`client-${this.como.client.id}.txt`);
    this.log(navigator.userAgent);

    window.addEventListener('error', (err) => {
      // https://developer.mozilla.org/en-US/docs/Web/API/ErrorEvent
      let msg = `${err.message} ${err.filename}:${err.lineno}`;
      this.log(msg);
    });

    // setTimeout(() => { throw new Error('test log') }, 5000);

    // playerProd only
    this.guiState = {
      showAdvancedSettings: false,
      showCalibrationScreen: false,
      showCreditsScreen: false,
      showInvalidSensorFramerateScreen: false,
    };

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

    for(const key of Object.keys(voxPlayerSchema) ) {
      if(schema.isStored(voxPlayerSchema, key)) {
        const value = storage.load(key);
        if(typeof value !== 'undefined') {
          this.events.emit(key, value);
        }
      }
    }

    const loadedState = await url.parse(voxPlayerSchema);
    console.log("loadedState = ", loadedState);

    if(typeof loadedState.tempo !== 'undefined') {
      this.setScoreCallback = () => {
        this.events.emit('tempo', loadedState.tempo);
        delete this.setScoreCallback;
      }
    }
    for( const [key, value] of Object.entries(loadedState) ) {
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

      if(score && score.dataChanged) {
        if(typeof this.setScoreCallback === 'function') {
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

    if(event || JSON.stringify(value) !== JSON.stringify(this.state[key] ) ) {
      app.events.emit(key, value);
    }
    this.render();
  }

  // immediate to data and asynchronously to voxPlayerState
  updateFromEvent(key, value) {
    const voxPlayerSchema = this.voxPlayerState.getSchema();
    const event = schema.isEvent(voxPlayerSchema, key);
    if(!event) {
      this.state[key] = value;

      const shared = schema.isShared(voxPlayerSchema, key);

      if(shared
         && JSON.stringify(value) !== JSON.stringify(this.voxPlayerState.get(key) ) ) {
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
            const name = (value ? value : undefined);
            document.title = `CoMo-Vo!x${name ? ` | ${name}` : ''}`;
            this.updateFromEvent(key, value);
            let scoreURI;
            const scoreURIbase = this.state[key];

            const urlType = url.type(name);

            if (urlType === 'url'
                || urlType === 'dataUrl'
                || urlType === 'blob') {
              scoreURI = name;
            }
            else if (!scoreURIbase || scoreURIbase === 'none') {
              scoreURI = null;
            } else {
              scoreURI = encodeURI(url.base
                                   + '/'
                                   + this.voxApplicationState.get('scoresPath')
                                   + '/'
                                   + scoreURIbase);
            }
            try {
              await this.setScore(scoreURI);
              this.render();
            } catch (error) {
              console.error('Error while loading score: ' + error.message);
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
          if(typeof scoreData.metas === 'undefined') {
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
          reject(new Error(`Error with midi file ${scoreURI}: `
                           + error.message) );
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
    const playbackChanged = this.playback !== playback;
    this.playback = playback;

    if(playback) {
      if(app.state['measures'] && playbackChanged) {
        app.events.emit('measuresClear', true);
      }
    } else {
      if(app.state['measures'] && playbackChanged) {
        app.events.emit('measuresFinalise', true);
      }
      switch(app.state['playbackStopSeek']) {
        case 'barStart': {
          this.seekPosition({
            bar: app.data.position.bar,
            beat: 1,
          });
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
    };

    const listeners = this.listeners;

    let screen = ``;

    if (!this.como.hasDeviceMotion && !this.state['mockSensors']) {
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
      if (!PLAYER_PROD) {
        screen = views[this.client.type](viewData, listeners, {
          verbose: false,
          enableSelection: false,
        });
      } else {
        screen = views.playerProd(viewData, listeners);
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
