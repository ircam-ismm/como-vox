import { html } from 'lit-html';

import {displayToggle} from './displayToggle.js';
import {
  elementClasses,
  extraClasses,
  groupClasses,
  selfSelect,
} from './helpers.js';

import {
  almostEquals,
  closest,
} from '../../../server/helpers/math.js';
const epsilon = 0.01;

const unitsAndNames = [
  [1, 'ronde'],
  [3/4, 'blanche pointée'],
  [1/2, 'blanche'],
  [3/8, 'noire pointée'],
  [1/4, 'noire'],
  [3/16, 'croche pointée'],
  [1/8, 'croche'],
  [1/16, 'double-croche'],
];

const units = unitsAndNames.map( (e) => e[0]);

const e = {};

export function beating(data) {
  const groupUi = data.beatingUnitUi
        || data.beatingUnitModeUi
  const voxPlayerState = data.voxPlayerState;

  return (data.uiConfiguration || groupUi ? html`
      <div class="${groupClasses(data, 'beating', groupUi)}">
        <span class="title text ${extraClasses(groupUi)}">Battue</span>

        ${data.uiConfiguration || data.tempoUi ? html`
          à la
          <select class="beatingUnit"
                  .value="${closest(units, data.beatingUnit)}"
                  @change="${e => {
                    const beatingUnit = parseFloat(e.target.value);
                    voxPlayerState.set({beatingUnit});
                  }}"
          >
          ${unitsAndNames.map( (unit) => {
            return html`
            <option
              .value="${unit[0]}"
              ?selected="${unit[0] === closest(units, data.beatingUnit)}"
            >${unit[1]}</option>
            `;
            }) }
          </select>
          ${data.uiConfiguration ? displayToggle(data, 'beatingUnitUi') : ''}
        </span>
        ` : ''}

        ${data.uiConfiguration || data.beatingUnitModeUi ? html`
        <span class="${elementClasses(data, 'beatingUnitMode')}">
          Décomposition
          <span class="selection">
            ${ [
                 ['auto', 'Automatique'],
                 ['timeSignature', 'Métrique'],
                 ['fixed', 'Fixée'],
               ].map( (mode) => {
            return html`
            <button class="option beatingUnitMode
                           ${data.beatingUnitMode === mode[0]
                           ? 'selected' : ''}"
                    @click="${e => voxPlayerState.set({beatingUnitMode: mode[0]})}">
              ${mode[1]}
            </button>
            `;
            }) }
          </span>

          ${data.uiConfiguration ? displayToggle(data, 'beatingUnitModeUi') : ''}
        </span>
        ` : ''}


      </div>
      ` : '');
}
Object.assign(e, {beating});

export default e;
