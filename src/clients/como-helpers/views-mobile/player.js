import {html} from 'lit-html';

import {clock} from '../templates/clock.js';
import {handedness} from '../templates/handedness.js';
import {latency} from '../templates/latency.js';
import {playback} from '../templates/playback.js';
import {position} from '../templates/position.js';
import {score} from '../templates/score.js';
import {session} from '../templates/session.js';
import {tempo} from '../templates/tempo.js';
import {timeSignature} from '../templates/timeSignature.js';

import {
  getBarBeat,
  getPosition,
  getTimeSignature,
  selfSelect,
} from '../templates/helpers.js';

export function player(data, listeners, {
  verbose = false,
  enableSelection = true,
} = {}) {
  const voxApplicationState = data.voxApplicationState;
  const voxPlayerState = data.voxPlayerState;
  const uiPreset = data.uiPreset;

  const bar = data.position.bar;
  const beat = data.position.beat;

  return html`
    <div class="mobile player">
      <!-- LOADER -->
      ${data.player.loading
        ? html`<div class="loadingBanner">Chargement...</div>`
        : ''}

      <!-- vvv NEW vvv -->
      ${session(data)}
      ${clock(data)}
      ${handedness(data)}
      ${latency(data)}
      ${score(data)}
      ${timeSignature(data)}
      ${tempo(data)}
      ${position(data)}
      ${playback(data)}
      <!-- ^^^ (NEW) ^^^ -->

        <button class="scenario ${data.scenarioCurrent === 'scenarioStartStopWithBeating' ? 'selected' : ''}"
                @click="${e => voxPlayerState.set({scenarioStartStopWithBeating: true}) }"
        >Départ</button>

      <div class="controls group">

        <div class="gesture controls container">
          Contrôle :
          ${uiPreset === 'full' ? html`
          <button class="onoff beating gesture ${data.gestureControlsBeatOffset ? 'selected' : ''}"
                  @click="${e => voxPlayerState.set({gestureControlsBeatOffset: !data.gestureControlsBeatOffset})}">
            Recalage
          </button>

          <button class="onoff beating gesture ${data.gestureControlsTempo ? 'selected' : ''}"
                  @click="${e => voxPlayerState.set({gestureControlsTempo: !data.gestureControlsTempo})}">
            Tempo
          </button>
          ` : html`
          <button class="onoff beating gesture ${(data.gestureControlsBeatOffset && data.gestureControlsTempo) ? 'selected' : ''}"
                  @click="${e => {
                         const onOff = !(data.gestureControlsBeatOffset && data.gestureControlsTempo);
                         voxPlayerState.set({
                         gestureControlsBeatOffset: onOff,
                         gestureControlsTempo: onOff,
                         });
                         } }">
            Tempo
          </button>
          `}
          <button class="onoff intensity gesture ${data.gestureControlsIntensity ? 'selected' : ''}"
                  @click="${e => voxPlayerState.set({gestureControlsIntensity: !data.gestureControlsIntensity})}">
            Dynamique
          </button>
        </div>

        <div class="audio controls container">
          Écoute :
          <button class="onoff metronome audio ${data.metronomeSound ? 'selected' : ''}"
                  @click="${e => voxPlayerState.set({metronomeSound: !data.metronomeSound})}">
            Métronome
          </button>

          ${uiPreset === 'full' ? html`
          <button class="onoff beating audio ${data.beatingSound ? 'selected' : ''}"
                  @click="${e => voxPlayerState.set({beatingSound: !data.beatingSound})}">
            Battue
          </button>

          ` : ''}
        </div>
      </div>

      ${verbose ?
      html`
      <pre>
        <code>
  > player:
  ${JSON.stringify(data.player, null, 2)}
        </code>
        <code>
  ${data.session ? `> session: "${data.session.name}"` : null}
  ${data.session ? `> graph: \n${JSON.stringify(data.session.graph, null, 2)}` : null}
        </code>
      </pre>
      ` : ``}

    </div>  `;
}

