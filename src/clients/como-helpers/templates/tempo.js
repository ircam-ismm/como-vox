import { html } from 'lit-html';

import {displayToggle} from './displayToggle.js';
import {
  elementClasses,
  extraClasses,
  groupClasses,
  selfSelect,
} from './helpers.js';

const e = {};

export function tempo(data) {
  const groupUi = data.tempoUi
        || data.scoreControlsTempoUi
        || data.tempoLimitsUi;
  const voxPlayerState = data.voxPlayerState;

  return (data.uiConfiguration || groupUi ? html`
      <div class="${groupClasses(data, 'tempo', groupUi)}">
        <span class="title text${extraClasses(groupUi)}">Tempo</span>

        ${data.uiConfiguration || data.tempoUi ? html`
        <span class="${elementClasses(data, 'tempo')}">
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
                       e.srcElement.value * 4 / data.timeSignature.division) || 60) }) } }"
          >

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

        ${data.uiConfiguration || data.tempoLimitsUi ? html`
          <span class="${elementClasses(data, 'tempoLimits')}">
            <span class="text">Limite de variation</span>
            <span class="valueUnit">
              <input class="tempoLimit relative"
                     type="number"
                     min="0"
                     step="10"
                     .value=${Math.round((data.tempoLimits.relativeMax - 1) * 100)}
                     @click="${e => selfSelect(e)}"
                     @change="${e => {
                       // do not change the absolute limits
                       const {absoluteMin, absoluteMax} = data.tempoLimits;
                       const percentMax = Math.max(0, parseFloat(e.target.value) );
                       const relativeMax = (percentMax / 100) + 1;
                       const relativeMin = 1 / relativeMax;
                       voxPlayerState.set({tempoLimits: {
                         absoluteMin,
                         absoluteMax,
                         relativeMin,
                         relativeMax,
                        } });
                       } }"
            ><span class="text">%</span>
          </span>
          ${data.uiConfiguration ? displayToggle(data, 'tempoLimitsUi') : ''}
        </span>
        ` : ''}



      </div>
      ` : '');
}
Object.assign(e, {tempo});

export default e;
