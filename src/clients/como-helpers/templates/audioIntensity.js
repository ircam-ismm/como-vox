import { html } from 'lit-html';

import {displayToggle} from './displayToggle.js';
import {
  elementClasses,
  extraClasses,
  groupClasses,
  selfSelect,
} from './helpers.js';

const e = {};

export function audioIntensity(data) {
  const groupUi = data.audioIntensityRangeUi;

  const voxPlayerState = data.voxPlayerState;

  return (data.uiConfiguration || groupUi ? html`
      <div class="${groupClasses(data, 'audioIntensityRange', groupUi)}">
        <span class="title text ${extraClasses(groupUi)}">Dynamique de l'audio</span>

        <span class="separator"></span>
        ${data.uiConfiguration || data.audioIntensityRangeUi ? html`
        <span class="${elementClasses(data, 'audioIntensityRange')}">
          <span class="text">Variation Maximale</span>
          <span class="valueUnit">
            <input type="number"
                   min="0"
                   max="80"
                   step="10"
                   .value=${data.audioIntensityRange}
                   @click="${e => selfSelect(e)}"
                   @change="${e => {
                               voxPlayerState.set({
                                 audioIntensityRange: parseFloat(e.srcElement.value),
                               });
                             } }"
            ><span class="text">dB</span>
          </span>

          ${data.uiConfiguration ? displayToggle(data, 'audioIntensityRangeUi') : ''}
        </span>
        ` : ''}

      </div>
      ` : '');
}
Object.assign(e, {audioIntensity});

export default e;
