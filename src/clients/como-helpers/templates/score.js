import { html } from 'lit-html';

import url from '../../shared/url.js';

import {displayToggle} from './displayToggle.js';
import {
  elementClasses,
  extraClasses,
  getInputValue,
  groupClasses,
} from './helpers.js';

const e = {};


function fileNameToValue(name) {
  return (name ? name : 'none');
}

function valueToFileName(value) {
  return (value !== 'none' ? value : 'none');
}

function valueToDisplay(value) {
  let display;

  if(url.validate(value) ) {
    display = 'lien';
  } else if(value === 'none') {
    display = 'aucune';
  } else {
    display = value;
  }

  return display;
}

export function score(data) {
  const groupUi = data.scoreFilesUi
        || data.scoreUrlOpenUi;
  const voxApplicationState = data.voxApplicationState;
  const voxPlayerState = data.voxPlayerState;

  return (data.uiConfiguration || groupUi ? html`
      <div class="${groupClasses(data, 'score', groupUi)}">
        <span class="title text ${extraClasses(groupUi)}">Partition</span>

        ${data.uiConfiguration || data.scoreFilesUi ? html`
        <span class="${elementClasses(data, 'scoreFile')}">
          <select class="${
                    !url.validate(data.scoreFileName) && !data.scoreReady
                    ? 'invalid'
                    : ''}"
                  .value=${fileNameToValue(data.scoreFileName) }
                  @change="${e => {
                         const scoreFileName = valueToFileName(e.target.value);
                         voxPlayerState.set({scoreFileName});
                         }}"
          >
          ${['none', ...voxApplicationState.get('scores')].map( (scoreValue) => {
            return html`
            <option
              .value=${scoreValue}
              ?selected="${fileNameToValue(data.scoreFileName) === scoreValue}"
            >${valueToDisplay(scoreValue) }</option>
            `;
            })}
          </select>
          ${data.uiConfiguration ? displayToggle(data, 'scoreFilesUi') : ''}
        </span>
        ` : ''}

        ${data.uiConfiguration || data.scoreUrlOpenUi ? html`
        <span class="${elementClasses(data, 'scoreUrlOpen')}">
          <input class="${
                    url.validate(data.scoreFileName) && !data.scoreReady
                    ? 'invalid'
                    : ''}"type="url"
                .value=${url.validate(data.scoreFileName) ? data.scoreFileName : ''}
                placeholder="https://"
          >
          <button @click="${e => {
             const scoreFileName = getInputValue(e);
             voxPlayerState.set({scoreFileName});
           } }"
          >Ouvrir le lien</button>

          ${data.uiConfiguration ? displayToggle(data, 'scoreUrlOpenUi') : ''}
        </span>
        ` : ''}



      </div>
      ` : '');
}
Object.assign(e, {score});

export default e;
