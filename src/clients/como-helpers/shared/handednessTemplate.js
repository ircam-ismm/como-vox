import { html } from 'lit-html';

import {displayToggle} from './displayToggleTemplate.js';

const e = {};

export function handedness(data) {
  const groupUi = data.uiConfiguration || data.handednessUi;
  const voxPlayerState = data.voxPlayerState;

  return (groupUi ? html`
      <div class="group handedness">

        ${data.uiConfiguration || data.handednessUi ? html`
          <span class="element handedness">
          <span class="text">Main utilisée</span>
          <span class="selection">
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
