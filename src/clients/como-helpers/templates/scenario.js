import {html} from 'lit-html';

import {displayToggle} from './displayToggle.js';
import {
  elementClasses,
  extraClasses,
  groupClasses,
} from './helpers.js';

const e = {};

export function scenario(data) {
  const groupUi = data.scenarioListeningUi
        || data.scenarioIntensity
        || data.scenarioTempoUi
        || data.scenarioStartStopWithBeatingUi
        || data.scenarioFullUi
        || data.scenarioPlaybackUi;

  const voxPlayerState = data.voxPlayerState;

  return (data.uiConfiguration || groupUi ? html`
      <div class="${groupClasses(data, 'scenario', groupUi)}">
        ${data.uiConfiguration || groupUi ? html`
          <span class="title text ${extraClasses(groupUi)}">Scénario</span>
          ` : ''}

          ${data.uiConfiguration || data.scenarioListeningUi ? html`
          <span class="${elementClasses(data, 'scenarioListening')}">


            <button class="toggle scenario ${data.scenarioCurrent === 'scenarioListening' ? 'selected' : ''}"
                  @click="${e => {
                     if(data.scenarioCurrent !== 'scenarioListening') {
                       voxPlayerState.set({scenarioListening: true});
                     } else {
                       voxPlayerState.set({scenarioListening: false});
                     }
                  } }"
            >Écoute</button>

            ${data.uiConfiguration
              ? displayToggle(data, 'scenarioListeningUi')
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
                       voxPlayerState.set({scenarioFull: false});
                     }
                  } }"
            >Complet</button>

            ${data.uiConfiguration
              ? displayToggle(data, 'scenarioFullUi')
              : ''}
        </span>
        ` : ''}


        ${data.uiConfiguration || data.scenarioPlaybackUi ? html`
          <span class="${elementClasses(data, 'scenarioPlayback')}">
          <span class="selection">
          ${ [ [false, 'Arrêt'],
               [true, 'Jeu'],
             ].map( ([onOff, display]) => {
            return html`
            <button class="option scenarioPlayback ${data.scenarioPlayback === onOff
                           ? 'selected on' : 'off'}"
                    @click="${e => voxPlayerState.set({scenarioPlayback: (onOff)})}">
              ${display}
            </button>
            `;
            }) }
          </span>
          ${data.uiConfiguration ? displayToggle(data, 'scenarioPlaybackUi') : ''}
        </span>
        ` : ''}


      </div>
      ` : '');
}
Object.assign(e, {scenario});

export default e;
