import { html } from 'lit-html';

import {displayToggle} from './displayToggle.js';
import {
  elementClasses,
  extraClasses,
  groupClasses,
  selfSelect,
} from './helpers.js';

const e = {};

export function gestureIntensity(data) {
  const groupUi = data.gestureIntensityInputMaxUi
        || data.gestureIntensityInputMediumRelativeUi
        || data.gestureIntensityNormalisedMediumUi;

  const voxPlayerState = data.voxPlayerState;

  return (data.uiConfiguration || groupUi ? html`
      <div class="${groupClasses(data, 'gestureIntensity', groupUi)}">
        <span class="title text ${extraClasses(groupUi)}">Dynamique du geste</span>

        <span class="separator"></span>
        ${data.uiConfiguration || data.gestureIntensityInputMaxUi ? html`
        <span class="${elementClasses(data, 'gestureIntensityInputMax')}">
          <span class="text">Geste maximum</span>
          <input type="number"
                 min="0"
                 max="1"
                 step="0.05"
                 .value=${data.gestureIntensityInputMax}
                 @click="${e => selfSelect(e)}"
                 @change="${e => {
                             voxPlayerState.set({
                               gestureIntensityInputMax: parseFloat(e.srcElement.value),
                             });
                           } }"
          >

          ${data.uiConfiguration ? displayToggle(data, 'gestureIntensityInputMaxUi') : ''}
        </span>
        ` : ''}

        ${data.uiConfiguration || data.gestureIntensityInputMediumRelativeUi ? html`
        <span class="${elementClasses(data, 'gestureIntensityInputMediumRelative')}">
          <span class="text">Geste medium</span>
          <span class="valueUnit">
            <input type="number"
                   min="0"
                   max="100"
                   step="10"
                   .value=${Math.round(data.gestureIntensityInputMediumRelative * 100)}
                   @click="${e => selfSelect(e)}"
                   @change="${e => {
                               const gestureIntensityInputMediumRelative
                                 = parseFloat(e.srcElement.value) * 0.01;
                               voxPlayerState.set({
                                 gestureIntensityInputMediumRelative,
                               });
                             } }"
            ><span class="text">%</span>
          </span>

          ${data.uiConfiguration ? displayToggle(data, 'gestureIntensityInputMediumRelativeUi') : ''}
        </span>
        ` : ''}

        ${data.uiConfiguration || data.gestureIntensityNormalisedMediumUi ? html`
        <span class="${elementClasses(data, 'gestureIntensityNormalisedMedium')}">
          <span class="text">Normalisation medium</span>
          <input type="number"
                 min="0"
                 max="1"
                 step="0.05"
                 .value=${data.gestureIntensityNormalisedMedium}
                 @click="${e => selfSelect(e)}"
                 @change="${e => {
                             voxPlayerState.set({
                               gestureIntensityNormalisedMedium: parseFloat(e.srcElement.value),
                             });
                           } }"
          >

          ${data.uiConfiguration ? displayToggle(data, 'gestureIntensityNormalisedMediumUi') : ''}
        </span>
        ` : ''}

      </div>
      ` : '');
}
Object.assign(e, {gestureIntensity});

export default e;
