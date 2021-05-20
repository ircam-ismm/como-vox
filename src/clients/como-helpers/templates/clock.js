import { html } from 'lit-html';

import {displayToggle} from './displayToggle.js';

const e = {};

export function clock(data) {
  const groupUi = data.uiConfiguration || data.clockTimeUi;

  return (groupUi ? html`
      <div class="group clock">
        ${data.uiConfiguration || data.clockTimeUi ? html`
        <span class="element time">
          <span class="text">${data.syncTime.toFixed(3)}</span>
          ${data.uiConfiguration ? displayToggle(data, 'clockTimeUi') : ''}
        </span>
        `: ''}
      </div>
      ` : '');
}
Object.assign(e, {clock});

export default e;
