import { html } from 'lit-html';

import {displayToggle} from './displayToggle.js';
import {
  elementClasses,
  extraClasses,
  groupClasses,
  selfSelect,
} from './helpers.js';

const e = {};

export function scoreIntensity(data) {
  const compressionUi = data.scoreIntensityCompressionModeUi
        || data.scoreIntensityCompressionMinMaxUi;
  const groupUi = data.scoreIntensityInputRangeDisplayUi
        || compressionUi;

  const voxPlayerState = data.voxPlayerState;

  const noteIntensityMin = (data.scoreData
                            && data.scoreData.metas
                            && data.scoreData.metas.noteIntensityMin
                            ? data.scoreData.metas.noteIntensityMin
                            : '');
  const noteIntensityMax = (data.scoreData
                            && data.scoreData.metas
                            && data.scoreData.metas.noteIntensityMax
                            ? data.scoreData.metas.noteIntensityMax
                            : '');

  return (data.uiConfiguration || groupUi ? html`
      <div class="${groupClasses(data, 'scoreIntensity', groupUi)}">
        <span class="title text ${extraClasses(groupUi)}">Dynamique de la partition</span>

        <span class="separator"></span>
        ${data.uiConfiguration || data.scoreIntensityInputRangeDisplayUi ? html`
        <span class="text ${extraClasses(data.scoreIntensityInputRangeDisplayUi)}">
          Étendue :
          ${noteIntensityMin} - ${noteIntensityMax}
        </span>

        ${data.uiConfiguration ? displayToggle(data, 'scoreIntensityInputRangeDisplayUi') : ''}
        ` : ''}


        <span class="separator"></span>
        ${data.uiConfiguration || compressionUi ? html`
        <span class="title text ${extraClasses(compressionUi)}">Compression</span>

        ${data.uiConfiguration || data.scoreIntensityCompressionModeUi ? html`
        <span class="${elementClasses(data, 'scoreIntensityCompressionMode')}">
          <span class="selection">
            ${ [
                 ['auto', 'Automatique'],
                 ['gesture', 'Geste'],
                 ['fixed', 'Fixe'],
                 ['off', 'Inactive'],
               ].map( (mode) => {
            return html`
            <button class="option scoreIntensityCompressionMode
                           ${data.scoreIntensityCompressionMode === mode[0]
                           ? 'selected' : ''}"
                    @click="${e => voxPlayerState.set({scoreIntensityCompressionMode: mode[0]})}">
              ${mode[1]}
            </button>
            `;
            }) }
          </span>

          ${data.uiConfiguration ? displayToggle(data, 'scoreIntensityCompressionModeUi') : ''}
        </span>
        ` : ''}


        <span class="separator"></span>
        ${data.uiConfiguration || data.scoreIntensityCompressionMinMaxUi ? html`
        <span class="${elementClasses(data, 'scoreIntensityCompressionMinMax')}">

          <span class="scoreIntensityCompressionMin">
            <span class="text">Minimum fixe</span>
            <input class="tempoLimit relative"
                   type="number"
                   min="0"
                   max="127"
                   step="10"
                   .value=${data.scoreIntensityCompressionMinFixed}
                   @click="${e => selfSelect(e)}"
                   @change="${e => {
                               const scoreIntensityCompressionMinFixed
                                 = Math.max(0,
                                            Math.min(127,
                                                     parseFloat(e.target.value) ) );
                               voxPlayerState.set({scoreIntensityCompressionMinFixed});
                             } }"
            >
          </span>

          <span class="scoreIntensityCompressionMin">
            <span class="text">Minimum geste</span>
            <input class="tempoLimit relative"
                   type="number"
                   min="0"
                   max="127"
                   step="10"
                   .value=${data.scoreIntensityCompressionMinGesture}
                   @click="${e => selfSelect(e)}"
                   @change="${e => {
                               const scoreIntensityCompressionMinGesture
                                 = Math.max(0,
                                            Math.min(127,
                                                     parseFloat(e.target.value) ) );
                               voxPlayerState.set({scoreIntensityCompressionMinGesture});
                             } }"
            >
          </span>

          <span class="scoreIntensityCompressionMax">
            <span class="text">Maximum</span>
            <input class="tempoLimit relative"
                   type="number"
                   min="0"
                   max="127"
                   step="10"
                   .value=${data.scoreIntensityCompressionMax}
                   @click="${e => selfSelect(e)}"
                   @change="${e => {
                               const scoreIntensityCompressionMax
                                 = Math.max(0,
                                            Math.min(127,
                                                     parseFloat(e.target.value) ) );
                               voxPlayerState.set({scoreIntensityCompressionMax});
                              } }"
            >
          </span>

          ${data.uiConfiguration ? displayToggle(data, 'scoreIntensityCompressionMinMaxUi') : ''}
        </span>
        ` : ''}

        ` : ''}

      </div>
      ` : '');
}
Object.assign(e, {scoreIntensity});

export default e;
