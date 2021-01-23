import { AbstractExperience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';

import {Blocked} from '@ircam/blocked';

import url from '../shared/url.js';
import CoMoPlayer from '../como-helpers/CoMoPlayer';
import views from '../como-helpers/views-mobile/index.js';

import midi from '../../shared/score/midi.js';

import {SampleManager} from '../shared/SampleManager.js';

// window.app from CoMoPlayer
const app = window.app;
const conversion = app.imports.helpers.conversion;
const beatsToSeconds = conversion.beatsToSeconds;
const positionAddBeats = conversion.positionAddBeats;

const audio = app.imports.helpers.audio;

if(typeof app.instruments === 'undefined') {
  app.instruments = {};
}

// for simple debugging in browser...
const MOCK_SENSORS = url.paramGet('mock-sensors');
console.info('> to mock sensors for debugging purpose, append "?mock-sensors=1" to URL');
console.info('> mock-sensors', MOCK_SENSORS);

const AUDIO_DEBUG = url.paramGet('audio-debug');
console.info('> to use audio for debugging purpose, append "?debug-audio=1" to URI');
console.info('> audio-debug', AUDIO_DEBUG);

const tempoDefault = 80;
const timeSignatureDefault = {count: 4, division: 4};
const positionDefault = {bar: 1, beat: 1};

const transportPlaybackDefault = true;

const metronomeSoundDefault = false;
const beatingSoundDefault = false;

const lookAheadBeatsDefault = 1;
const sensorsLatencyDefault = 1 / 60; // 60 Hz?

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

    this.voxApplicationState = null;
    this.voxPlayerState = null;

    this.score = null;
    this.scoreReady = false;

    this.position = positionDefault;

    this.transportPlayback = transportPlaybackDefault;

    this.tempo = tempoDefault;
    this.tempoFromScore = true;
    this.timeSignature = timeSignatureDefault;
    this.timeSignatureFromScore = true;

    // default values

    // in beats, not taking account of audioLatency
    this.lookAheadBeats = lookAheadBeatsDefault;
    // in seconds, taking audioLatency into account
    this.lookAheadSeconds = 0;

    this.sensorsLatency = sensorsLatencyDefault;

    // in seconds
    // @TODO discover and store in localStorage
    this.audioLatency = 0;

    this.gestureControlsBeatOffset = false;
    this.gestureControlsTempo = false;

    this.metronomeSound = undefined;
    this.beatingSound = undefined;

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

    this.voxPlayerState.subscribe(updates => {
      for (let [key, value] of Object.entries(updates)) {
        switch (key) {
          case 'record': {
            if (updates['record'] && this.coMoPlayer && this.coMoPlayer.graph) {
              this.coMoPlayer.graph.modules['bridge'].addListener(frame => {
                // console.log(frame);
              });
            } else {
              this.voxPlayerState.set({ record: false });
            }
            break;
          }

          case 'score': {
            let scoreURI;
            const scoreURIbase = this.voxPlayerState.get('score');
            if(!scoreURIbase || scoreURIbase === 'none') {
              scoreURI = null;
            } else {
              scoreURI = this.voxApplicationState.get('scoresPath')
                + '/'
                + scoreURIbase;
            }
            try {
              this.setScore(scoreURI)
            } catch (error) {
              console.error(error.message);
            }
            break;
          }
        }
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
    this.coMoPlayer.setSource(source);

    this.audioContext = this.como.audioContext;
    this.pianoSampleManager = new SampleManager({
      audioContext: this.audioContext,
      // baseUrl: 'soundfonts/bright_acoustic_piano',
      baseUrl: 'soundfonts/acoustic_grand_piano',
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
      this.setTransportPlayback(transportPlaybackDefault);
      this.setTempo(tempoDefault);
      this.setTimeSignature(timeSignatureDefault);

      this.setMetronomeSound(metronomeSoundDefault);
      this.setBeatingSound(beatingSoundDefault);

      this.setLookAheadBeats(lookAheadBeatsDefault);
      this.seekPosition(positionDefault);

      this.setSensorsLatency(sensorsLatencyDefault);

      this.coMoPlayer.graph.modules['bridge'].subscribe(frame => {
        // console.log('frame', JSON.parse(JSON.stringify(frame)));

        this.position = frame['position'];
        this.transportPlayback = frame['playback'];

        const score = frame['score'];
        if(this.tempoFromScore && score && score.tempo) {
          this.setTempo(score.tempo);
        } else {
          // avoid loop-back
          this.setTempo(frame['tempo'], {transportUpdate: false});
        }

        if(this.timeSignatureFromScore) {
          if(score && score.timeSignature) {
            this.setTimeSignature(score.timeSignature);
          }
        } else {
          this.setTimeSignature(frame['timeSignature']);
        }

        this.updateLookAhead({allowMoreBeats: false});
      });
    });

    if(AUDIO_DEBUG) {
      this.audioDebugInit();
    }

    window.addEventListener('resize', () => this.render());

    const updateClock = () => {
      this.render();
      this.rafId = window.requestAnimationFrame(updateClock);
    };

    this.rafId = window.requestAnimationFrame(updateClock);
  }

  setGraphOptions(node, updates) {
    if(this.coMoPlayer && this.coMoPlayer.graph
       && this.coMoPlayer.graph.modules[node]) {
      this.coMoPlayer.player.setGraphOptions(node, updates);
    }
  }

  async setScore(scoreURI) {
    if(!scoreURI) {
      this.score = null;
      this.scoreReady = true;
      this.coMoPlayer.player.setGraphOptions('score', {
        scriptParams: {
          score: this.score,
        },
      });

      // do not delete notes of previously loaded score
      return Promise.resolve(null);
    }

    const promise = new Promise( (resolve, reject) => {
      const request = new window.XMLHttpRequest();
      request.open('GET', scoreURI, true);
      request.responseType = 'arraybuffer'; // binary data

      request.onerror = () => {
        reject(new Error(`Unable to GET ${sourceUrl}, status ${request.status} `
                         + `${request.responseText}`) );
      };

      request.onload = async () => {
        if (request.status < 200 || request.status >= 300) {
          request.onerror();
          return;
        }

        try {
          this.score = midi.parse(request.response);
          this.scoreReady = true;
          this.coMoPlayer.player.setGraphOptions('score', {
            scriptParams: {
              score: this.score,
            },
          });

          // no duplicates in set
          const notes = new Set();
          this.score.partSet.forEach( (part, p) => {
            part.events.forEach( (event) => {
              if(event.type === 'noteOn') {
                notes.add(event.data.pitch);
              }
            });
          });

          await this.pianoSampleManager.update({notes});

          resolve(this.score);
        } catch (error) {
          reject(new Error(`Error with midi file ${scoreURI}: `
                           + error.message) );
        }
      };

      this.scoreReady = false;
      this.score = null;
      request.send(null);
    });

    return promise;
  }

  setSensorsLatency(sensorsLatency) {
    const sensorsLatencyLast = this.sensorsLatency
    this.sensorsLatency = sensorsLatency;

    if(this.sensorsLatency !== sensorsLatencyLast) {
      this.setGraphOptions('beatTriggerFromGesture', {
        scriptParams: {
          sensorsLatency: this.sensorsLatency,
        },
      });
    }
  }

  setAudioLatency(audioLatency) {
    this.audioLatency = audioLatency;
    this.updateLookAhead();
  }

  setLookAheadBeats(lookAheadBeats) {
    this.lookAheadBeats = lookAheadBeats;
    this.updateLookAhead();
  }

  updateLookAhead({
    allowMoreBeats = true,
  } = {}) {
    const lookAheadSecondsLast = this.lookAheadSeconds;

    if(this.lookAheadBeats === 0) {
      this.lookAheadSeconds = 0;
    } else {
      if(allowMoreBeats) {
        while(
          (this.lookAheadSeconds = beatsToSeconds(this.lookAheadBeats, {
            tempo: this.tempo,
            timeSignature: this.timeSignature,
          })
           - this.audioLatency)
           <= this.lookAheadSecondsMin) {
            ++this.lookAheadBeats;
        }
      } else {
        this.lookAheadSeconds = beatsToSeconds(this.lookAheadBeats, {
          tempo: this.tempo,
          timeSignature: this.timeSignature,
        })
          - this.audioLatency;
      }
    }

    if(lookAheadSecondsLast !== this.lookAheadSeconds) {
      ['clickSynth', 'samplePlayer'].forEach( (node) => {
        this.setGraphOptions(node, {
          scriptParams: {
            lookAheadSeconds: this.lookAheadSeconds,
          },
        });
      });

    }

  }

  setTempo(tempo, {
    transportUpdate = true,
  } = {}) {
    if(!tempo || tempo === this.tempo) {
      return;
    }
    this.tempo = tempo;

    if(transportUpdate) {
      this.setGraphOptions('transport', {
        scriptParams: {
          tempo,
        },
      });
    }

    this.updateLookAhead();
  }

  setTempoFromScore(onOff) {
    this.tempoFromScore = onOff;
  }

  setTimeSignature(timeSignature) {
    // object equal
    if(!timeSignature
       || (JSON.stringify(this.timeSignature.count)
           === JSON.stringify(timeSignature.count) ) ) {
      return;
    }

    this.timeSignature = timeSignature;
    this.setGraphOptions('transport', {
      scriptParams: {
        timeSignature,
      },
    });
    this.updateLookAhead();
  }

  setTimeSignatureFromScore(onOff) {
    this.timeSignatureFromScore = onOff;
  }

  seekPosition(position) {
    ['transport', 'score'].forEach( (script) => {
      this.setGraphOptions(script, {
        scriptParams: {
          seekPosition: position,
        },
      });
    });
  }

  setGestureControlsBeatOffset(control) {
    this.gestureControlsBeatOffset = control;
    this.setGraphOptions('transport', {
      scriptParams: {
        gestureControlsBeatOffset: this.gestureControlsBeatOffset,
      },
    });
  }

  setGestureControlsTempo(control) {
    this.gestureControlsTempo = control;
    this.setGraphOptions('transport', {
      scriptParams: {
        gestureControlsTempo: this.gestureControlsTempo,
      },
    });
  }

  setTransportPlayback(playback) {
    this.transportPlayback = playback;
    ['transport', 'score'].forEach( (node) => {
      this.setGraphOptions(node, {
        scriptParams: {
          playback,
        },
      });
    });
  }

  setMetronomeSound(onOff) {
    this.metronomeSound = onOff;
    this.setGraphOptions('clickGenerator', {
      scriptParams: {
        onOff,
      },
    });

  }

  setBeatingSound(onOff) {
    this.beatingSound = onOff;
    this.setGraphOptions('clackFromBeat', {
      scriptParams: {
        onOff,
      },
    });

  }

  audioDebugInit() {
    const noiseBuffer = audio.generateNoiseBuffer({
      audioContext: this.audioContext,
      duration: 1, // seconds,
      gain: -30, // dB
    });

    const blocked = new Blocked( (duration) => {
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
      config: this.config,
      boundingClientRect: this.$container.getBoundingClientRect(),
      project: this.como.project.getValues(),
      player: this.coMoPlayer.player.getValues(),
      session: this.coMoPlayer.session ? this.coMoPlayer.session.getValues() : null,
      experience: this,

      voxApplicationState: this.voxApplicationState,
      voxPlayerState: this.voxPlayerState,

      syncTime,
      transportPlayback: this.transportPlayback,
      position: this.position, // this.positionCompensated,
      tempo: this.tempo,
      tempoFromScore: this.tempoFromScore,
      timeSignature: this.timeSignature,
      timeSignatureFromScore: this.timeSignatureFromScore,
      sensorsLatency: this.sensorsLatency,
      audioLatency: this.audioLatency,
      lookAheadBeats: this.lookAheadBeats,
      lookAheadSeconds: this.lookAheadSeconds,

      gesture: {
        controlsBeatOffset: this.gestureControlsBeatOffset,
        controlsTempo: this.gestureControlsTempo,
      },

      metronomeSound: {onOff: this.metronomeSound},
      beatingSound: {onOff: this.beatingSound},
    };

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
