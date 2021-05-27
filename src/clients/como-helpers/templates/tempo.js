import { html } from 'lit-html';

import {displayToggle} from './displayToggle.js';
import {
  elementClasses,
  groupClasses,
  selfSelect,
} from './helpers.js';

const e = {};

export function tempo(data) {
  const groupUi = data.tempoUi
        || data.scoreControlsTempoUi;
  const voxPlayerState = data.voxPlayerState;

  return (data.uiConfiguration || groupUi ? html`
      <div class="${groupClasses(data, 'tempo', groupUi)}">

        ${data.uiConfiguration || data.tempoUi ? html`
        <span class="${elementClasses(data, 'tempo')}">
          <span class="text">Tempo</span>
          <input type="number"
                 min="10"
                 max="300"
                 step="10"
                 .value=${
                 // tempo for quarter-note
                 Math.round(data.tempo * data.timeSignature.division / 4)}
                 @click="${e => selfSelect(e)}"
                 @change="${e => {
                       // tempo for quarter-note
                       voxPlayerState.set({
                       tempo: (parseFloat(
                       e.srcElement.value * 4 / data.timeSignature.division) || 60) }) } }">


          <button class="trigger tempo"
                  @click="${e => voxPlayerState.set({tempoReset: true}) }"
          >Remettre</button>
          ${data.uiConfiguration ? displayToggle(data, 'tempoUi') : ''}
        </span>
        ` : ''}

        ${data.uiConfiguration || data.scoreControlsTempoUi ? html`
          <span class="${elementClasses(data, 'scoreControlsTempo')}">
          <span class="selection">
            ${ [false, true].map( (onOff) => {
                return html`
            <button class="option scoreControlsTempo ${data.scoreControlsTempo === onOff
                           ? 'selected' : ''}"
                    @click="${e => voxPlayerState.set({scoreControlsTempo: (onOff)})}">
              ${!onOff ? 'Libre' : 'Partition'}
            </button>
                `;
            }) }
          </span>
          ${data.uiConfiguration ? displayToggle(data, 'scoreControlsTempoUi') : ''}
        </span>
        ` : ''}



      </div>
      ` : '');
}
Object.assign(e, {tempo});

export default e;
