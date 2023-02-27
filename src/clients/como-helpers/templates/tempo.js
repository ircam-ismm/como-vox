import { html } from 'lit-html';

import {displayToggle} from './displayToggle.js';
import {
  elementClasses,
  extraClasses,
  groupClasses,
  selfSelect,
} from './helpers.js';

import {tempoChangeBeatingUnit} from '../../../server/helpers/conversion.js';

const e = {};

export function tempo(data) {
  const groupUi = data.tempoUi
        || data.tempoResetUi
        || data.scoreControlsTempoUi
        || data.peakThresholdUi
        || data.tempoLimitsUi
        || data.beatOffsetRangeUi;
  const voxPlayerState = data.voxPlayerState;

  return (data.uiConfiguration || groupUi ? html`
      <div class="${groupClasses(data, 'tempo', groupUi)}">
        <span class="title text ${extraClasses(groupUi)}">Tempo</span>

        ${data.uiConfiguration || data.tempoUi ? html`
        <span class="${elementClasses(data, 'tempo')}">
          <input type="number"
                 min="10"
                 max="300"
                 step="10"
                 .value=${
                 // tempo for quarter-note
                   Math.round(tempoChangeBeatingUnit(data.tempo, {
                     timeSignature: data.timeSignature,
                     beatingUnit: 1/4,
                     beatingUnitNew: data.beatingUnit
                   }))
                 }
                 @click="${e => selfSelect(e)}"
                 @change="${e => {
                       const value = parseFloat(e.srcElement.value) || 60;
                       // tempo for quarter-note
                       const tempo = tempoChangeBeatingUnit(value, {
                         timeSignature: data.timeSignature,
                         beatingUnit: data.beatingUnit,
                         beatingUnitNew: 1/4,
                      });
                       voxPlayerState.set({tempo});
                 } }"
          >
          ${data.uiConfiguration ? displayToggle(data, 'tempoUi') : ''}
        </span>
        ` : ''}

        ${data.uiConfiguration || data.tempoResetUi ? html`
        <span class="${elementClasses(data, 'tempoReset')}">

          <button class="trigger tempo"
                  @click="${e => voxPlayerState.set({tempoReset: true}) }"
          >Remettre</button>
          ${data.uiConfiguration ? displayToggle(data, 'tempoResetUi') : ''}
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
                       const relativeMin = 2 - relativeMax;
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


        ${data.uiConfiguration || data.beatOffsetRangeUi ? html`
          <span class="${elementClasses(data, 'beatOffsetRange')}">
            <span class="text">Limite de recalage de phase</span>
            <span class="valueUnit">
              <input type="number"
                     min="1"
                     max="2"
                     step="0.25"
                     .value=${Math.round(data.beatOffsetRange * 100) / 100}
                     @click="${e => selfSelect(e)}"
                     @change="${e => {
                       // do not change the absolute limits
                       const beatOffsetRange
                         = Math.max(0, parseFloat(e.target.value) );
                       voxPlayerState.set({beatOffsetRange});
                       } }"
            ><span class="text">temps</span>
          </span>
          ${data.uiConfiguration ? displayToggle(data, 'beatOffsetRangeUi') : ''}
        </span>
        ` : ''}


        ${data.uiConfiguration || data.peakThresholdUi ? html`
          <span class="${elementClasses(data, 'peakThreshold')}">
            <span class="text">Énergie de la battue</span>
            <span class="valueUnit">
              <input type="number"
                     min="10"
                     max="200"
                     step="10"
                     .value=${Math.round(data.peakThresholdSensitive * 100) / 100}
                     @click="${e => selfSelect(e)}"
                     @change="${e => {
                           // do not change the absolute limits
                           const peakThresholdSensitive
                           = Math.max(0, parseFloat(e.target.value) );
                           voxPlayerState.set({peakThresholdSensitive});
                           } }"
              ><span class="text">sensible</span>
            </span>

            <span class="valueUnit">
              <input type="number"
                     min="10"
                     max="200"
                     step="10"
                     .value=${Math.round(data.peakThresholdSafe * 100) / 100}
                     @click="${e => selfSelect(e)}"
                     @change="${e => {
                           // do not change the absolute limits
                           const peakThresholdSafe
                           = Math.max(0, parseFloat(e.target.value) );
                           voxPlayerState.set({peakThresholdSafe});
                           } }"
              ><span class="text">sûr</span>
            </span>


          ${data.uiConfiguration ? displayToggle(data, 'peakThresholdUi') : ''}
        </span>
        ` : ''}



      </div>
      ` : '');
}
Object.assign(e, {tempo});

export default e;
