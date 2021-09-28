import { html } from 'lit-html';

import {displayToggle} from './displayToggle.js';
import {
  elementClasses,
  groupClasses,
} from './helpers.js';

const e = {};

export function clock(data) {
  const groupUi = data.clockTimeUi;

  return (data.uiConfiguration || groupUi ? html`
      <div class="${groupClasses(data, 'clock', groupUi)}">
        ${data.uiConfiguration || data.clockTimeUi ? html`
        <span class="${elementClasses(data, 'clockTime')}">
          <span class="text">${data.syncTime.toFixed(3)}</span>
          ${data.uiConfiguration ? displayToggle(data, 'clockTimeUi') : ''}
        </span>
        `: ''}

      </div>
      ` : '');
}
Object.assign(e, {clock});

export default e;
