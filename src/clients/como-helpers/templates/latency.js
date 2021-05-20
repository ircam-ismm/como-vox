import {html} from 'lit-html';

import {displayToggle} from './displayToggle.js';
import {selfSelect} from './helpers.js';

const e = {};

export function latency(data) {
  const groupUi = data.uiConfiguration
        || data.audioLatencyUi
        || data.lookAheadNotesRequestUi;
  const voxPlayerState = data.voxPlayerState;

  return (groupUi ? html`
      <div class="group latency">

        ${data.uiConfiguration || data.audioLatencyUi ? html`
        <span class="element audioLatency">
          <span class="text">Latence audio</span>
          <input type="number"
                 min="0"
                 max="500"
                 step="10"
                 .value=${Math.round(data.audioLatency * 1e3)}
                 @click="${e => selfSelect(e)}"
                 @change="${e => {
                       voxPlayerState.set({
                       audioLatency: (parseFloat(e.srcElement.value * 1e-3) || 0),
                       });
                       } }">
          <span class="text">ms</span>
          <button class="toggle scenario ${data.scenarioCurrent === 'scenarioLatencyCalibration' ? 'selected' : ''}"
                  @click="${e => voxPlayerState.set({scenarioLatencyCalibration: true}) }"
          >Calibrer</button>

          ${data.uiConfiguration ? displayToggle(data, 'audioLatencyUi') : ''}
        </span>
        ` : ''}

        ${data.uiConfiguration || data.lookAheadNotesRequestUi ? html`
        <span class="element lookAhead">
          <span class="text">Prévision minimale</span>
          <input type="number"
                 min="0"
                 max="32"
                 step="1"
                 .value=${data.lookAheadNotesRequest * 8}
                 @click="${e => selfSelect(e)}"
                 @change="${e => {
                       voxPlayerState.set({
                       lookAheadNotesRequest: (parseFloat(e.srcElement.value / 8) || 0),
                       });
                       } }">
          <span class="text">
            croche${data.lookAheadNotesRequest * 8 > 1 ? 's' : ''}
            (courante : ${data.lookAheadNotes * 8}
            croche${data.lookAheadNotes * 8 > 1 ? 's' : ''},
            ${data.lookAheadBeats} temps,
            ${Math.round(data.lookAheadSeconds * 1e3)} ms)
          </span>
          ${data.uiConfiguration
            ? displayToggle(data, 'lookAheadNotesRequestUi')
            : ''}
        </span>
        `: ''}

      </div>
      ` : '');
}
Object.assign(e, {latency});

export default e;
