import {html} from 'lit-html';

import {displayToggle} from './displayToggle.js';
import {
  elementClasses,
  groupClasses,
} from './helpers.js';


import {player} from './player.js';

const e = {};

export function options(data) {
    const dataOptions = {
        ...data,
        uiConfiguration: true,
    };

    const voxPlayerState = data.voxPlayerState;


  return html`
    <div class="options">
      <span class="navigation">
        <button class="toggle ${data.uiOptions ? 'selected' : ''}"
                @click="${e => {
                  voxPlayerState.set({uiOptions: !data.uiOptions});
                } }"
      >Options</button>

      </span>

      ${data.uiOptions ? html`
      <span class="options">
        ${player(dataOptions)};
      </span>
    ` : '' }

    </div>
`;
}
Object.assign(e, {options});

export default e;
