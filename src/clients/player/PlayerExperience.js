import { AbstractExperience } from '@soundworks/core/client';
import { render, html } from 'lit-html';
import renderInitializationScreens from '@soundworks/template-helpers/client/render-initialization-screens.js';
import CoMoPlayer from '../como-helpers/CoMoPlayer';
import views from '../como-helpers/views-mobile/index.js';

// window.app from CoMoPlayer
const app = window.app;
const conversion = app.imports.helpers.conversion;
const beatsToSeconds = conversion.beatsToSeconds;
const positionAddBeats = conversion.positionAddBeats;

// for simple debugging in browser...
const MOCK_SENSORS = window.location.hash === '#mock-sensors';
console.info('> to mock sensors for debugging purpose, use https://127.0.0.1:8000/designer#mock-sensors');
console.info('> hash:', window.location.hash, '- mock sensors:', MOCK_SENSORS);

const tempoDefault = 60;
const timeSignatureDefault = {count: 4, division: 4};

const transportPlaybackDefault = true;

const lookAheadBeatsDefault = 0;
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

    this.position = {
      bar: 0,
      beat: 0,
    };

    this.transportPlayback = transportPlaybackDefault;

    this.tempo = tempoDefault;
    this.timeSignature = timeSignatureDefault;

    // default values

    // in beats, not taking account of audioLatency
    this.lookAheadBeats = lookAheadBeatsDefault;
    // in seconds, taking audioLatency into account
    this.lookAheadSeconds = 0;

    this.sensorsLatency = sensorsLatencyDefault;

    // in seconds
    // @TODO discover and store in localStorage
    this.audioLatency = 0;

    this.gestureControlsBeat = false;
    this.gestureControlsTempo = false;

    this.metronomeSound = true;
    this.beatingSound = true;

    // configure como w/ the given experience
    this.como.configureExperience(this);
    // default initialization views
    renderInitializationScreens(como.client, config, $container);
  }

  async start() {
    super.start();
    // console.log('hasDeviceMotion', this.como.hasDeviceMotion);

    // 1. create a como player instance w/ a unique id (we default to the nodeId)
    const player = await this.como.project.createPlayer(this.como.client.id);
    const voxPlayerState = await this.client.stateManager.create('vox-player');

    voxPlayerState.subscribe(updates => {
      for (let [key, value] of Object.entries(updates)) {
        switch (key) {
          case 'record': {
            if (updates['record'] && this.coMoPlayer && this.coMoPlayer.graph) {
              this.coMoPlayer.graph.modules['bridge'].addListener(frame => {
                // console.log(frame);
              });
            } else {
              voxPlayerState.set({ record: false });
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
      this.setLookAheadBeats(lookAheadBeatsDefault);

      this.setSensorsLatency(sensorsLatencyDefault);

      this.coMoPlayer.graph.modules['bridge'].subscribe(frame => {
        // console.log('frame', JSON.parse(JSON.stringify(frame)));

        this.position = frame['position'];
        this.transportPlayback = frame['playback'];
        this.tempo = frame['tempo'];
        this.timeSignature = frame['timeSignature'];
        this.updateLookAhead({allowMoreBeats: false});
      });
    });

    window.addEventListener('resize', () => this.render());

    const updateClock = () => {
      this.render();
      this.rafId = window.requestAnimationFrame(updateClock);
    };

    this.rafId = window.requestAnimationFrame(updateClock);
  }

  setSensorsLatency(sensorsLatency) {
    const sensorsLatencyLast = this.sensorsLatency
    this.sensorsLatency = sensorsLatency;

    if(this.sensorsLatency !== sensorsLatencyLast) {
      this.coMoPlayer.player.setGraphOptions('beatTriggerFromGesture', {
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
      this.coMoPlayer.player.setGraphOptions('clickSynth', {
        scriptParams: {
          lookAheadSeconds: this.lookAheadSeconds,
        },
      });

    }

  }

  setTempo(tempo) {
    this.tempo = tempo;

    // @TODO: how to propagate to all relevant scripts that are in graph?
    // (server crashes with non-instantiated scripts)
    this.coMoPlayer.player.setGraphOptions('transport', {
        scriptParams: {
          tempo,
        },
    });
    this.updateLookAhead();
  }

  setTimeSignature(timeSignature) {
    this.timeSignature = timeSignature;
    this.coMoPlayer.player.setGraphOptions('transport', {
        scriptParams: {
          timeSignature,
        },
    });
    this.updateLookAhead();
  }

  setGestureControlsBeat(control) {
    this.gestureControlsBeat = control;
    this.coMoPlayer.player.setGraphOptions('transport', {
        scriptParams: {
          gestureControlsBeat: this.gestureControlsBeat,
        },
    });
  }

  setGestureControlsTempo(control) {
    this.gestureControlsTempo = control;
    this.coMoPlayer.player.setGraphOptions('transport', {
        scriptParams: {
          gestureControlsTempo: this.gestureControlsTempo,
        },
    });
  }

  setTransportPlayback(playback) {
    this.transportPlayback = playback;
    this.coMoPlayer.player.setGraphOptions('transport', {
        scriptParams: {
          playback,
        },
    });
  }

  setMetronomeSound(onOff) {
    this.metronomeSound = onOff;
    this.coMoPlayer.player.setGraphOptions('clickGenerator', {
        scriptParams: {
          onOff,
        },
    });

  }

  setBeatingSound(onOff) {
    this.beatingSound = onOff;
    this.coMoPlayer.player.setGraphOptions('clackFromBeat', {
        scriptParams: {
          onOff,
        },
    });

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

      syncTime,
      transportPlayback: this.transportPlayback,
      position: positionCompensated,
      tempo: this.tempo,
      timeSignature: this.timeSignature,
      sensorsLatency: this.sensorsLatency,
      audioLatency: this.audioLatency,
      lookAheadBeats: this.lookAheadBeats,
      lookAheadSeconds: this.lookAheadSeconds,

      gesture: {
        controlsBeat: this.gestureControlsBeat,
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
        enableSelection: true,
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
