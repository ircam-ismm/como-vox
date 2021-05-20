import { html } from 'lit-html';

import {displayToggle} from './displayToggle.js';
import {
  elementClasses,
  getTimeSignature,
  groupClasses,
  selfSelect,
} from './helpers.js';

const e = {};

export function timeSignature(data) {
  const groupUi = data.timeSignatureUi;
  const voxPlayerState = data.voxPlayerState;

  return (data.uiConfiguration || groupUi ? html`
      <div class="${groupClasses(data, 'timeSignature', groupUi)}">

        ${data.uiConfiguration || data.timeSignatureUi ? html`
        <span class="${elementClasses(data, 'timeSignature')}">
          <span class="text">Métrique</span>
          <span class="timeSignature flexContainer nogap">
            <input class="count"
                   type="number"
                   min="1"
                   max="32"
                   step="1"
                   .value=${data.timeSignature.count}
                   @click="${e => selfSelect(e)}"
                   @change="${e => voxPlayerState.set({timeSignature: (getTimeSignature(e) )}) }">
            <span class="text">/</span>
            <input class="division"
                   type="number"
                   min="1"
                   max="32"
                   step="1"
                   .value=${data.timeSignature.division}
                   @click="${e => selfSelect(e)}"
                   @change="${e => voxPlayerState.set({timeSignature: (getTimeSignature(e) )}) }">
          </span>
          ${data.uiConfiguration ? displayToggle(data, 'timeSignatureUi') : ''}
          </span>
          ` : ''}

      </div>
      ` : '');
}
Object.assign(e, {timeSignature});

export default e;
