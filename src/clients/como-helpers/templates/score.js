import { html } from 'lit-html';

import {displayToggle} from './displayToggle.js';
import {
  elementClasses,
  groupClasses,
} from './helpers.js';

const e = {};

export function score(data) {
  const groupUi = data.scoreUi;
  const voxApplicationState = data.voxApplicationState;
  const voxPlayerState = data.voxPlayerState;

  return (data.uiConfiguration || groupUi ? html`
      <div class="${groupClasses(data, 'score', groupUi)}">

        ${data.uiConfiguration || data.scoreUi ? html`
        <span class="${elementClasses(data, 'score')}">
          <span class="title text">Partition</span>
          <select class="${!data.scoreReady ? 'invalid' : ''}"
                  .value=${data.scoreFileName ? data.scoreFileName : 'none'}
                  @change="${e => {
                         const scoreFileName = (e.target.value === 'none' ? null : e.target.value);
                         voxPlayerState.set({scoreFileName});
                         }}"
          >
            ${['none', ...voxApplicationState.get('scores')].map( (scoreFileName) => {
            return html`
            <option
              .value=${scoreFileName}
              ?selected="${data.scoreFileName
                     === (scoreFileName === 'none' ? null : scoreFileName)}"
            >${scoreFileName === 'none' ? 'aucune' : scoreFileName}</option>
            `;
            })}
          </select>
          ${data.uiConfiguration ? displayToggle(data, 'scoreUi') : ''}
        </span>
        ` : ''}

      </div>
      ` : '');
}
Object.assign(e, {score});

export default e;
