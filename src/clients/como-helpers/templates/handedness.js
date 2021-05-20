import { html } from 'lit-html';

import {displayToggle} from './displayToggle.js';
import {
  elementClasses,
  groupClasses,
} from './helpers.js';

const e = {};

export function handedness(data) {
  const groupUi = data.handednessUi;
  const voxPlayerState = data.voxPlayerState;

  return (data.uiConfiguration || groupUi ? html`
      <div class="${groupClasses(data, 'handedness', groupUi)}">

        ${data.uiConfiguration || data.handednessUi ? html`
          <span class="${elementClasses(data, 'handedness')}">
          <span class="text">Main utilisée</span>
          <span class="selection flexContainer">
            ${ ['left', 'right'].map( (handedness) => {
              return html`
            <button class="option handedness ${data.handedness === handedness
                                            ? 'selected' : ''}"
                    @click="${e => voxPlayerState.set({handedness}) }">
              ${handedness === 'left' ? 'Gauche' : 'Droite'}
            </button>
              `;}) }
          </span>
          ${data.uiConfiguration ? displayToggle(data, 'handednessUi') : ''}
        </span>
        ` : ''}

      </div>
      ` : '');
}
Object.assign(e, {handedness});

export default e;
