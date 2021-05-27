import {html} from 'lit-html';

import {displayToggle} from './displayToggle.js';
import {
  elementClasses,
  groupClasses,
  selfSelect,
} from './helpers.js';

const e = {};

export function latency(data) {
  const groupUi = data.audioLatencyUi
        || data.lookAheadNotesRequestUi;
  const voxPlayerState = data.voxPlayerState;

  return (data.uiConfiguration || groupUi ? html`
      <div class="${groupClasses(data, 'latency', groupUi)}">

        ${data.uiConfiguration || data.audioLatencyUi ? html`
        <span class="${elementClasses(data, 'audioLatency')}">
          <span class="text">Latence audio</span>
          <span class="valueUnit">
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
          </span>
          <button class="toggle scenario ${data.scenarioCurrent === 'scenarioLatencyCalibration' ? 'selected' : ''}"
                  @click="${e => {
                     if(data.scenarioCurrent !== 'scenarioLatencyCalibration') {
                       voxPlayerState.set({scenarioLatencyCalibration: true});
                     } else {
                       voxPlayerState.set({playback: false});
                       voxPlayerState.set({scenarioLatencyCalibration: false});
                     }
                  } }"
          >Calibrer</button>

          ${data.uiConfiguration ? displayToggle(data, 'audioLatencyUi') : ''}
        </span>
        ` : ''}

        ${data.uiConfiguration || data.lookAheadNotesRequestUi ? html`
        <span class="${elementClasses(data, 'lookAheadNotesRequest')}">
          <span class="text">Prévision minimale</span>
          <span class="valueUnit">
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
            </span>
          </span>
          <span class="text">
            (courante :
            ${data.lookAheadNotes * 8} croche${data.lookAheadNotes * 8 > 1 ? 's' : ''},
            ${data.lookAheadBeats} temps,
            ${Math.round(data.lookAheadSeconds * 1e3)} ms)
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
