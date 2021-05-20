import { html } from 'lit-html';

import {displayToggle} from './displayToggle.js';
import {
  elementClasses,
  getPosition,
  groupClasses,
  selfSelect,
} from './helpers.js';

const e = {};

export function position(data) {
  const groupUi = data.positionUi
        || data.seekPositionBarUi
        || data.seekPositionBeatUi
        || data.seekPositionRestartUi
  ;

  const voxPlayerState = data.voxPlayerState;

  return (data.uiConfiguration || groupUi ? html`
      <div class="${groupClasses(data, 'position', groupUi)}">

        ${data.uiConfiguration || data.seekPositionBarUi ? html`
        <span class="${elementClasses(data, 'seekPositionBar')}">
          <span class="text">Mesure</span>
          <input class="position bar"
                 type="number"
                 step="1"
                 .value=${!data.position
                          ? 0
                          : (data.position.bar > 0
                             ? data.position.bar
                             : data.position.bar - 1)}
                 @click="${e => selfSelect(e)}"
                 @change="${e => voxPlayerState.set({seekPosition: getPosition(e) }) }"
          >
          ${data.uiConfiguration ? displayToggle(data, 'seekPositionBarUi') : ''}
        </span>
        ` : ''}

        ${data.uiConfiguration || data.seekPositionBeatUi ? html`
        <span class="${elementClasses(data, 'seekPositionBeat')}">
          <span class="text">Temps</span>
          <input class="position beat"
                 type="number"
                 step="1"
                 .value=${!data.position
                          ? 0
                          : Math.floor(data.position.beat)}
                 @click="${e => selfSelect(e)}"
                 @change="${e => voxPlayerState.set({seekPosition: getPosition(e) }) }"
          >
          ${data.uiConfiguration ? displayToggle(data, 'seekPositionBeatUi') : ''}
        </span>
        ` : ''}

        ${data.uiConfiguration || data.seekPositionRestartUi ? html`
        <span class="${elementClasses(data, 'seekPositionRestart')}">
          <button class="seek"
                  @click="${e => voxPlayerState.set({seekPosition: {bar: 1, beat: 1}}) }"
          >Recommencer</button>
          ${data.uiConfiguration ? displayToggle(data, 'seekPositionRestartUi') : ''}
        </span>
        ` : ''}




      </div>
      ` : '');
}
Object.assign(e, {position});

export default e;
