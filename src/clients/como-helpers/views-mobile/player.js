import {html} from 'lit-html';

import {latency} from '../shared/latencyTemplate.js';
import {clock} from '../shared/clockTemplate.js';
import {handedness} from '../shared/handednessTemplate.js';
import {session} from '../shared/sessionTemplate.js';

import {
  getBarBeat,
  getPosition,
  getTimeSignature,
  selfSelect,
} from '../shared/templateHelpers.js';

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
      ${data.player.loading ?
      html`<div class="loadingBanner">Chargement...</div>` : ''
      }

      <!-- vvv NEW vvv -->
      ${session(data)}
      ${clock(data)}
      ${handedness(data)}
      ${latency(data)}
      <!-- ^^^ (NEW) ^^^ -->

      <div class="score container">
        <select class="${!data.scoreReady ? 'invalid' : ''}"
                .value=${data.scoreFileName ? data.scoreFileName : 'none'}
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

      <div class="tempo container">Tempo :
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
        <div class="selection">
          ${ [false, true].map( (onOff) => {
              return html`
          <button class="set scoreControlsTempo ${data.scoreControlsTempo === onOff
                         ? 'selected' : ''}"
                  @click="${e => voxPlayerState.set({scoreControlsTempo: (onOff)})}">
            ${!onOff ? 'Libre' : 'Partition'}
          </button>
              `;
          }) }
        </div>
        ` : ''}
        <button class="trigger tempo"
                @click="${e => voxPlayerState.set({tempoReset: true}) }"
        >Remettre</button>

      </div>

      <div class="timeSignature container">Métrique :
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
        <div class="onoff transport">
          ${ [false, true].map( (onOff) => {
          return html`
          <button class="set playback ${data.playback === onOff
                         ? 'selected on' : 'off'}"
                  @click="${e => voxPlayerState.set({playback: (onOff)})}">
            ${!onOff ? 'Stop' : 'Jouer'}
          </button>
          `;
          }) }
          Reprise :
          ${['barStart', 'start', null].map( (seek) => {
          return html`
          <button class="set playbackStop mode ${data.playbackStopSeek === seek
                         ? 'selected' : ''}"
                  @click="${e => voxPlayerState.set({playbackStopSeek: seek}) }">
            ${seek === 'start' ? 'Début' : ''}
            ${seek === 'barStart' ? 'Mesure' : ''}
            ${seek === null ? 'Pause' : ''}
          </button>
          `;
          }) }
        </div>

        ${uiPreset === 'full' ? html`
        <button class="scenario ${data.scenarioCurrent === 'scenarioStartStopWithBeating' ? 'selected' : ''}"
                @click="${e => voxPlayerState.set({scenarioStartStopWithBeating: true}) }"
        >Départ</button>
        <div class="onoff transport">
          <div class="count container">Départ :
            ${ [false, true].map( (onOff) => {
            return html`
            <button class="set scoreControlsPlaybackStart ${data.gestureControlsPlaybackStart === onOff
                           ? 'selected' : ''}"
                    @click="${e => voxPlayerState.set({gestureControlsPlaybackStart: (onOff)})}">
              ${!onOff ? 'Libre' : 'Geste'}
            </button>
            `;
            }) }
            après :
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
        <div class="onoff transport">
          <div class="count container">Arrêt :
            ${ [false, true].map( (onOff) => {
            return html`
            <button class="set scoreControlsPlaybackStop ${data.gestureControlsPlaybackStop === onOff
                           ? 'selected' : ''}"
                    @click="${e => voxPlayerState.set({gestureControlsPlaybackStop: (onOff)})}">
              ${!onOff ? 'Libre' : 'Geste'}
            </button>
            `;
            }) }
            après :
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
        <div class="onoff transport">Lecture :
            ${ [false, true].map( (onOff) => {
            return html`
            <button class="set scoreControlsPlaybackStart scoreControlsPlaybackStop ${data.gestureControlsPlaybackStart === onOff && data.gestureControlsPlaybackStop === onOff
                           ? 'selected' : ''}"
                    @click="${e => {
                                voxPlayerState.set({gestureControlsPlaybackStart: (onOff)});
                                voxPlayerState.set({gestureControlsPlaybackStop: (onOff)});
                             } }">
              ${!onOff ? 'Libre' : 'Geste'}
            </button>
            `;
            }) }

           <button class=" ${data.scenarioCurrent === 'scenarioStartStopWithBeating' ? 'selected' : ''}"
                  @click="${e => voxPlayerState.set({scenarioStartStopWithBeating: true}) }"
           >Commencer</button>

        </div>
        `}



      </div>

      <div class="position container">Position :
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

