import { html } from 'lit-html';

import {displayToggle} from './displayToggle.js';
import {
  elementClasses,
  extraClasses,
  groupClasses,
  selfSelect,
} from './helpers.js';

const e = {};

export function gestureAdaptation(data) {

  const voxApplicationState = data.voxApplicationState;
  const voxPlayerState = data.voxPlayerState;

  const groupUi = data.gestureAdaptationIntensityModeUi
        || data.gestureAdaptationTempoModeUi;


  return (data.uiConfiguration || groupUi ? html`
      <div class="${groupClasses(data, 'gestureAdaptation', groupUi)}">
        <span class="title text ${extraClasses(groupUi)}">Adaptation au geste</span>

        <span class="separator"></span>

        ${data.uiConfiguration || data.gestureAdaptationIntensityModeUi ? html`
        <span class="${elementClasses(data, 'gestureAdaptationIntensityMode')}">
            <span class="text">Nuance</span>
            <span class="selection">
          ${Object.entries(voxApplicationState.get('gestureAdaptationIntensityModes') ).map( ([name, value]) => {
                return html`
              <button class="option gestureAdaptation ${data.gestureIntensityInputMax === value
                         ? 'selected' : ''}"
                      @click="${e => voxPlayerState.set({gestureIntensityInputMax: (value)})}">
              ${name}
              </button>
              `;
              }) }
          </span>

          ${data.uiConfiguration ? displayToggle(data, 'gestureAdaptationIntensityModeUi') : ''}
        </span>
        ` : ''}

        <span class="separator"></span>

        ${data.uiConfiguration || data.gestureAdaptationTempoModeUi ? html`
        <span class="${elementClasses(data, 'gestureAdaptationTempoMode')}">
            <span class="text">Tempo</span>
            <span class="selection">
          ${Object.entries(voxApplicationState.get('gestureAdaptationTempoModes') ).map( ([name, value]) => {
                return html`
              <button class="option gestureAdaptation ${data.audioLatencyAdaptation === value
                         ? 'selected' : ''}"
                      @click="${e => voxPlayerState.set({audioLatencyAdaptation: (value)})}">
              ${name}
              </button>
              `;
              }) }
          </span>

          ${data.uiConfiguration ? displayToggle(data, 'gestureAdaptationTempoModeUi') : ''}
        </span>
        ` : ''}

      </div>
      ` : '');
}
Object.assign(e, {gestureAdaptation});

export default e;
