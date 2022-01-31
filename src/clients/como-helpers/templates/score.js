import { html } from 'lit-html';

import url from '../../shared/url.js';

import {displayToggle} from './displayToggle.js';
import {
  elementClasses,
  extraClasses,
  getInputValue,
  getInputFile,
  groupClasses,
  selfSelect,
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

  switch(url.type(value) ) {
    case 'null':
      display = 'aucune';
      break;

    case 'url':
      display = 'lien';
      break;

    case 'dataUrl':
    case 'blob':
      display = 'fichier';
      break;

    default:
      display = value;
      break;
  }

  return display;
}

export function score(data) {
  const groupUi = data.scoreFilesUi
        || data.scoreFileOpenUi
        || data.scoreUrlOpenUi;
  const voxApplicationState = data.voxApplicationState;
  const voxPlayerState = data.voxPlayerState;

  return (data.uiConfiguration || groupUi ? html`
      <div class="${groupClasses(data, 'score', groupUi)}">
        <span class="title text ${extraClasses(groupUi)}">Partition</span>

        ${data.uiConfiguration || data.scoreFilesUi ? html`
        <span class="${elementClasses(data, 'scoreFile')}">
          <select class="${
                    url.type(data.scoreFileName) === 'other' && !data.scoreReady
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
                    url.type(data.scoreFileName) === 'other' && !data.scoreReady
                    ? 'invalid'
                    : ''}"
                 type="url"
                 @click="${e => selfSelect(e)}"
                 .value=${url.type(data.scoreFileName) === 'url'
                          ? data.scoreFileName
                          : ''}
                 placeholder="(coller le lien ici)"
          >
          <button @click="${e => {
             const scoreFileName = getInputValue(e);
             voxPlayerState.set({scoreFileName});
           } }"
          >Ouvrir le lien</button>

          ${data.uiConfiguration ? displayToggle(data, 'scoreUrlOpenUi') : ''}
        </span>
        ` : ''}

        ${data.uiConfiguration || data.scoreFileOpenUi ? html`
        <span class="${elementClasses(data, 'scoreFileOpen')}">
          <input type="file"
                 accept="audio/midi"
                 hidden
                 @change="${e => {
                   console.log('inputFile.click()', e);
                   event.preventDefault();
                   const fileList = e.target.files;
                   for (let i = 0, numFiles = fileList.length; i < numFiles; i++) {
                     const file = fileList[i];
                     console.log('file', file);
                     const reader = new FileReader();
                     reader.addEventListener("load", () => {
                       voxPlayerState.set({scoreFileName: reader.result});
                     });
                     reader.readAsDataURL(file);
                   }

                 } }"
          >
          <button @click="${e => {
             console.log('button.click()', e);
             const inputFile = getInputFile(e);
             inputFile.click(event);
           } }"
          >Ouvrir un fichier</button>

          ${data.uiConfiguration ? displayToggle(data, 'scoreFileOpenUi') : ''}
        </span>
        ` : ''}

      </div>
      ` : '');
}
Object.assign(e, {score});

export default e;
