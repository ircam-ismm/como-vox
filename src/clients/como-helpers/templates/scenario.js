import {html} from 'lit-html';

import {displayToggle} from './displayToggle.js';
import {
  elementClasses,
  extraClasses,
  groupClasses,
} from './helpers.js';

const e = {};

export function scenario(data) {
  const groupUi = data.scenarioPalybackUi
        || data.scenarioIntensity
        || data.scenarioTempoUi
        || data.scenarioStartStopWithBeatingUi
        || data.scenarioFullUi;

  const voxPlayerState = data.voxPlayerState;

  return (data.uiConfiguration || groupUi ? html`
      <div class="${groupClasses(data, 'scenario', groupUi)}">
        ${data.uiConfiguration || groupUi ? html`
          <span class="title text ${extraClasses(groupUi)}">Scénario</span>
          ` : ''}

          ${data.uiConfiguration || data.scenarioPlaybackUi ? html`
          <span class="${elementClasses(data, 'scenarioPlayback')}">


            <button class="toggle scenario ${data.scenarioCurrent === 'scenarioPlayback' ? 'selected' : ''}"
                  @click="${e => {
                     if(data.scenarioCurrent !== 'scenarioPlayback') {
                       voxPlayerState.set({scenarioPlayback: true});
                     } else {
                       voxPlayerState.set({playback: false});
                       voxPlayerState.set({scenarioPlayback: false});
                     }
                  } }"
            >Écoute</button>

            ${data.uiConfiguration
              ? displayToggle(data, 'scenarioPlaybackUi')
              : ''}
        </span>
        ` : ''}

          ${data.uiConfiguration || data.scenarioIntensityUi ? html`
          <span class="${elementClasses(data, 'scenarioIntensity')}">


            <button class="toggle scenario ${data.scenarioCurrent === 'scenarioIntensity' ? 'selected' : ''}"
                  @click="${e => {
                     if(data.scenarioCurrent !== 'scenarioIntensity') {
                       voxPlayerState.set({scenarioIntensity: true});
                     } else {
                       voxPlayerState.set({playback: false});
                       voxPlayerState.set({scenarioIntensity: false});
                     }
                  } }"
            >Nuance</button>

            ${data.uiConfiguration
              ? displayToggle(data, 'scenarioIntensityUi')
              : ''}
        </span>
        ` : ''}

          ${data.uiConfiguration || data.scenarioTempoUi ? html`
          <span class="${elementClasses(data, 'scenarioTempo')}">


            <button class="toggle scenario ${data.scenarioCurrent === 'scenarioTempo' ? 'selected' : ''}"
                  @click="${e => {
                     if(data.scenarioCurrent !== 'scenarioTempo') {
                       voxPlayerState.set({scenarioTempo: true});
                     } else {
                       voxPlayerState.set({playback: false});
                       voxPlayerState.set({scenarioTempo: false});
                     }
                  } }"
            >Tempo</button>

            ${data.uiConfiguration
              ? displayToggle(data, 'scenarioTempoUi')
              : ''}
        </span>
        ` : ''}

          ${data.uiConfiguration || data.scenarioStartStopWithBeatingUi ? html`
          <span class="${elementClasses(data, 'scenarioStartStopWithBeating')}">


            <button class="toggle scenario ${data.scenarioCurrent === 'scenarioStartStopWithBeating' ? 'selected' : ''}"
                  @click="${e => {
                     if(data.scenarioCurrent !== 'scenarioStartStopWithBeating') {
                       voxPlayerState.set({scenarioStartStopWithBeating: true});
                     } else {
                       voxPlayerState.set({playback: false});
                       voxPlayerState.set({scenarioStartStopWithBeating: false});
                     }
                  } }"
            >Départ</button>

            ${data.uiConfiguration
              ? displayToggle(data, 'scenarioStartStopWithBeatingUi')
              : ''}
        </span>
        ` : ''}

          ${data.uiConfiguration || data.scenarioFullUi ? html`
          <span class="${elementClasses(data, 'scenarioFull')}">


            <button class="toggle scenario ${data.scenarioCurrent === 'scenarioFull' ? 'selected' : ''}"
                  @click="${e => {
                     if(data.scenarioCurrent !== 'scenarioFull') {
                       voxPlayerState.set({scenarioFull: true});
                     } else {
                       voxPlayerState.set({playback: false});
                       voxPlayerState.set({scenarioFull: false});
                     }
                  } }"
            >Complet</button>

            ${data.uiConfiguration
              ? displayToggle(data, 'scenarioFullUi')
              : ''}
        </span>
        ` : ''}


      </div>
      ` : '');
}
Object.assign(e, {scenario});

export default e;
