import { html } from 'lit-html';
import * as styles from './styles.js';

function getTimeSignature (event) {
  const parentElement = event.srcElement.parentElement;
  const count = parseFloat(parentElement.querySelector('.count').value) || 4;
  const division = parseFloat(parentElement.querySelector('.division').value) || 4;
  return {count, division};
}

function getBarBeat (event) {
  const parentElement = event.srcElement.parentElement;
  const bar = parseFloat(parentElement.querySelector('.bar').value) || 0;
  const beat = parseFloat(parentElement.querySelector('.beat').value) || 0;
  return {bar, beat};
}

function getPosition (event) {
  const parentElement = event.srcElement.parentElement;
  let bar = parseFloat(parentElement.querySelector('.bar').value) || 1;
  if(bar <= 0) {
    bar += 1;
  }
  const beatElement = parentElement.querySelector('.beat');
  const beat = (beatElement && parseFloat(beatElement.value) ) || 1;
  return {bar, beat};
}

function selfSelect(event) {
  const element = event.srcElement;
  try {
    // mainly for mobile
    element.setSelectionRange(0, element.value.length);
  } catch (error) {
    // forget it
  }
}

export function player(data, listeners, {
  verbose = false,
  enableSelection = true,
} = {}) {
  const voxApplicationState = data.voxApplicationState;
  const voxPlayerState = data.voxPlayerState;
  const uiPreset = data.uiPreset;

  const bar = data.position.bar;
  const beat = data.position.beat;

  const lookAheadNotes = data.lookAheadNotes;

  return html`
    <!-- LOADER -->
    ${data.player.loading ?
      html`<div style="${styles.loadingBanner}">Chargement...</div>` : ''
    }
    <!-- HEADER -->

    <div style="position: relative" class="container">
      <span class="info">
        ${uiPreset === 'full' ? html`
        <span style="${styles.h3}" class="session">Session: ${data.session.name}</span>
        `: ''}
        <span style="${styles.h3}" class="session">Identifiant&nbsp;: ${data.player.id}</span>
      </span>

      ${uiPreset === 'full' && enableSelection ? html`
      <button class="setSession"
              @click="${e => listeners.setPlayerParams({ sessionId: null })}">
        Choisir session
      </button>
      ` : ''}
    </div>

    <div class="audioLatency container">Latence audio&nbsp;:
      <input type="number"
             min="0"
             max="500"
             step="10"
             .value=${data.audioLatency * 1e3}
             @click="${e => selfSelect(e)}"
             @change="${e => {
                          voxPlayerState.set({
                            audioLatency: (parseFloat(e.srcElement.value * 1e-3) || 0),
                          });
                        } }">
      ms
    </div>

    ${uiPreset === 'full' ? html`
    <div class="lookAhead container">Prévision&nbsp;:
      <input type="number"
             min="0"
             max="32"
             step="0.125"
    .value=${lookAheadNotes * 8}
             @click="${e => selfSelect(e)}"
             @change="${e => {
                     voxPlayerState.set({
                       lookAheadNotes: (parseFloat(e.srcElement.value / 8) || 0),
                     });
                   } }">
      croche${lookAheadNotes * 8 > 1 ? 's' : ''}
      (${data.lookAheadBeats} temps,
      ${Math.round(data.lookAheadSeconds * 1e3)} ms)
    </div>
    ` : '' }

    <div class="time container">
      ${data.syncTime.toFixed(3)}
    </div>

    <div class="score container">
      <select class="${!data.scoreReady ? 'invalid' : ''}"
        @change="${e => {
          const scoreFileName = (e.target.value === 'none' ? null : e.target.value);
          voxPlayerState.set({scoreFileName});
        }}"
      >
        ${['none', ...voxApplicationState.get('scores')].map( (scoreFileName) => {
        return html`
        <option
          .value=${scoreFileName}
          ?selected="${data.scoreFileName
            === (scoreFileName === 'none' ? null : scoreFileName)}"
        >${scoreFileName === 'none' ? 'aucune' : scoreFileName}</option>
        `;
        })}
     </select>
    </div>

    <div class="tempo container">Tempo&nbsp;:
      <input type="number"
             min="10"
             max="300"
             step="10"
             .value=${
             // tempo for quarter-note
             Math.round(data.tempo * data.timeSignature.division / 4)}
             @click="${e => selfSelect(e)}"
             @change="${e => {
                   // tempo for quarter-note
                   voxPlayerState.set({
                     tempo: (parseFloat(
                       e.srcElement.value * 4 / data.timeSignature.division) || 60) }) } }">

      ${uiPreset === 'full' ? html`
      depuis la partition&nbsp;:
      <sc-toggle
        .active="${data.scoreControlsTempo}"
        @change="${e => voxPlayerState.set({scoreControlsTempo: (e.detail.value)})}"
      ></sc-toggle>
      ` : ''}
      <button class="tempo"
              @click="${e => voxPlayerState.set({tempoReset: true}) }"
      >Remettre</button>

    </div>

    <div class="timeSignature container">Métrique&nbsp;:
      <input class="count"
             type="number"
             min="1"
             max="32"
             step="1"
             .value=${data.timeSignature.count}
             @click="${e => selfSelect(e)}"
             @change="${e => voxPlayerState.set({timeSignature: (getTimeSignature(e) )}) }">
      /
      <input class="division"
             type="number"
             min="1"
             max="32"
             step="1"
             .value=${data.timeSignature.division}
             @click="${e => selfSelect(e)}"
             @change="${e => voxPlayerState.set({timeSignature: (getTimeSignature(e) )}) }">
    </div>

    <div class="controls container">
      <div class="onoff transport">Lecture&nbsp;:
        <sc-toggle
          width="48"
          .active="${data.playback}"
          @change="${e => voxPlayerState.set({playback: (e.detail.value)}) }"
        ></sc-toggle>
      </div>

      ${uiPreset === 'full' ? html`
      <div class="onoff transport">Départ&nbsp;:
        <sc-toggle
          .active="${data.gestureControlsPlaybackStart}"
          @change="${e => voxPlayerState.set({gestureControlsPlaybackStart: (e.detail.value)}) }"
        ></sc-toggle>
        <div class="count container">après&nbsp;:
          <input class="bar"
                 type="number"
                 min="0"
                 max="3"
                 step="1"
                 .value=${data.playbackStartAfterCount.bar}
                 @click="${e => selfSelect(e)}"
                 @change="${e => voxPlayerState.set({playbackStartAfterCount: (getBarBeat(e) )}) }">
          mesure${data.playbackStartAfterCount.bar > 1 ? 's' : ''}
          <input class="beat"
                 type="number"
                 min="0"
                 max="16"
                 step="1"
                 .value=${data.playbackStartAfterCount.beat}
                 @click="${e => selfSelect(e)}"
                 @change="${e => voxPlayerState.set({playbackStartAfterCount: (getBarBeat(e) )}) }">
          temps
        </div>
      </div>
      <div class="onoff transport">Arrêt&nbsp;:
        <sc-toggle
          .active="${data.gestureControlsPlaybackStop}"
          @change="${e => voxPlayerState.set({gestureControlsPlaybackStop: (e.detail.value)}) }"
        ></sc-toggle>
        <div class="count container">après&nbsp;:
          <input class="bar"
                 type="number"
                 min="0"
                 max="3"
                 step="0.5"
                 .value=${data.playbackStopAfterCount.bar}
                 @click="${e => selfSelect(e)}"
                 @change="${e => voxPlayerState.set({playbackStopAfterCount: (getBarBeat(e) )}) }">
          mesure${data.playbackStartAfterCount.bar > 1 ? 's' : ''}
          <input class="beat"
                 type="number"
                 min="0"
                 max="32"
                 step="1"
                 .value=${data.playbackStopAfterCount.beat}
                 @click="${e => selfSelect(e)}"
                 @change="${e => voxPlayerState.set({playbackStopAfterCount: (getBarBeat(e) )}) }">
          temps
        </div>

      </div>
          ` : html`
      <div class="onoff transport">Suivant le geste&nbsp;:
        <sc-toggle
          .active="${data.gestureControlsPlaybackStart && data.gestureControlsPlaybackStop}"
          @change="${e => {
                       voxPlayerState.set({gestureControlsPlaybackStart: (e.detail.value)});
                       voxPlayerState.set({gestureControlsPlaybackStop: (e.detail.value)});
                     }
                   }"
        ></sc-toggle>
      </div>
      `}



    </div>

    <div class="position container">Position&nbsp;:
      ${uiPreset === 'full' ? html`
      ${[{bar: -1, beat: 1},
         {bar: 0, beat: 1},
         {bar: 1, beat: 1}].map( (position) => {
           return html`
      <button class="seek"
              @click="${e => voxPlayerState.set({seekPosition: position}) }">
        Aller à ${position.bar < 1
        // display for bar < 1 with -1 offset
        ? position.bar - 1
        : position.bar }
      </button>
      `;})}
    ` : html`
      <button class="seek"
              @click="${e => voxPlayerState.set({seekPosition: {bar: 1, beat: 1}}) }"
      >Recommencer</button>
    `}

      <input class="time bar"
             type="number"
             step="1"
             .value=${!data.position
             ? 0
             : (data.position.bar > 0
      ? data.position.bar
      : data.position.bar - 1)}
      @click="${e => selfSelect(e)}"
      @change="${e => voxPlayerState.set({seekPosition: getPosition(e) }) }"
      >${uiPreset === 'full' ? html`
      :<input class="time beat"
             type="number"
             step="1"
             min"1"
             .value=${!data.position
             ? 0
             : Math.floor(beat)}
             @click="${e => selfSelect(e)}"
             @change="${e => voxPlayerState.set({seekPosition: getPosition(e) }) }"
      >
      ` : ''}
    </div>

    <div class="controls container">

      ${uiPreset === 'full' ? html`
      <div class="onoff beating audio">Recalage
        <sc-toggle
          .active="${data.gestureControlsBeatOffset}"
          @change="${e => voxPlayerState.set({gestureControlsBeatOffset: (e.detail.value)}) }"
        ></sc-toggle>
      </div>

      <div class="onoff beating audio">Tempo
        <sc-toggle
          .active="${data.gestureControlsTempo}"
          @change="${e => voxPlayerState.set({gestureControlsTempo:(e.detail.value)}) }"
        ></sc-toggle>
      </div>
      ` : html`
      <div class="onoff beating audio">Tempo
        <sc-toggle
          .active="${data.gestureControlsBeatOffset && data.gestureControlsTempo}"
          @change="${e => {
                        voxPlayerState.set({gestureControlsTempo:(e.detail.value)});
                        voxPlayerState.set({gestureControlsBeatOffset:(e.detail.value)});
                     }
                   }"
        ></sc-toggle>
      </div>
      `}
      <div class="onoff beating audio">Dynamique
        <sc-toggle
          .active="${data.gestureControlsIntensity}"
          @change="${e => voxPlayerState.set({gestureControlsIntensity:(e.detail.value)}) }"
        ></sc-toggle>
      </div>

      <div class="onoff metronome audio">Métronome
        <sc-toggle
          .active="${data.metronomeSound}"
          @change="${e => voxPlayerState.set({metronomeSound:(e.detail.value)}) }"
        ></sc-toggle>
      </div>

      ${uiPreset === 'full' ? html`
      <div class="onoff beating audio">Battue
        <sc-toggle
          .active="${data.beatingSound}"
          @change="${e => voxPlayerState.set({beatingSound:(e.detail.value)}) }"
        ></sc-toggle>
      </div>
      ` : ''}
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
  `;
}

