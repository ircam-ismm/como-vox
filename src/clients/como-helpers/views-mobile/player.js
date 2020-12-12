import { html } from 'lit-html';
import * as styles from './styles.js';

function getTimeSignature (event) {
  const parentElement = event.srcElement.parentElement;
  const count = parseFloat(parentElement.querySelector('.count').value) || 4;
  const division = parseFloat(parentElement.querySelector('.division').value) || 4;
  return {count, division};
}

function selfSelect(event) {
  const element = event.srcElement;
  try {
    // mainly for mobile
    element.setSelectionRange(0, element.value.length);
  } catch (error) {
    // forget it
  }
}

export function player(data, listeners, {
  verbose = false,
  enableSelection = true,
} = {}) {
  const experience = data.experience;

  return html`
    <!-- LOADER -->
    ${data.player.loading ?
      html`<div style="${styles.loadingBanner}">loading...</div>` : ''
    }
    <!-- HEADER -->

    <div style="position: relative">
      <div class="info">
        <span style="${styles.h3}" class="session">Session: ${data.session.name}</span>
        <span style="${styles.h3}" class="session">PlayerId: ${data.player.id}</span>
      </div>

      ${enableSelection ?
        html`
          <button
            style="
              ${styles.button}
            "
            @click="${e => listeners.setPlayerParams({ sessionId: null })}">
            change session
          </button>
        ` : ``
      }
    </div>

    <div class="audioLatency">Sensors Latency:
      <input type="number"
             min="0"
             max="100"
             step="5"
             .value="${data.sensorsLatency * 1e3}"
             @click="${e => selfSelect(e)}"
             @change="${e => {
                   experience.setSensorsLatency(parseFloat(e.srcElement.value * 1e-3) || 0);
                   } }">
      ms
    </div>

    <div class="audioLatency">Audio Latency:
      <input type="number"
             min="0"
             max="500"
             step="10"
             .value="${data.audioLatency * 1e3}"
             @click="${e => selfSelect(e)}"
             @change="${e => {
                   experience.setAudioLatency(parseFloat(e.srcElement.value * 1e-3) || 0);
                   } }">
      ms
    </div>

    <div class="lookAhead">Look-ahead:
      <input type="number"
             min="0"
             max="32"
             step="1"
             .value="${data.lookAheadBeats}"
             @click="${e => selfSelect(e)}"
             @change="${e => {
                   experience.setLookAheadBeats(parseFloat(e.srcElement.value) || 0);
                   } }">
      beat${data.lookAheadBeats > 1 ? 's' : ''}
      (${data.lookAheadSeconds * 1e3} ms)
    </div>

    <div class="time">
      ${data.syncTime.toFixed(3)}
    </div>

    <div class="tempo">Tempo:
      <input type="number"
             min="10"
             max="300"
             step="10"
             .value="${data.tempo}"
             @click="${e => selfSelect(e)}"
             @change="${e => {
                   experience.setTempo(parseFloat(e.srcElement.value) || 60);
                   } }">
    </div>

    <div class="timeSignature">Time signature:
      <input class="count"
             type="number"
             min="1"
             max="32"
             step="1"
             .value="${data.timeSignature.count}"
             @click="${e => selfSelect(e)}"
             @change="${e => experience.setTimeSignature(getTimeSignature(e) )}">
      /
      <input class="division"
             type="number"
             min="1"
             max="32"
             step="1"
             .value="${data.timeSignature.division}"
             @click="${e => selfSelect(e)}"
             @change="${e => experience.setTimeSignature(getTimeSignature(e) )}">
    </div>

    <div class="position">Position: <span class="time">${data.position
      ? `${data.position.bar}/${data.position.beat.toFixed(2)}`
      : '?/?'}<span></div>


    <div class="controls-container">

      <div class="onoff metronome control">Metronome:
        <sc-toggle
          .active="${!data.metronome.mute}"
          @change="${e => experience.setMetronomeMute(!e.detail.value)}"
        ></sc-toggle>
      </div>

      <div class="onoff beating control">Beating:
        <sc-toggle
          .active="${!data.beating.mute}"
          @change="${e => experience.setBeatingMute(!e.detail.value)}"
        ></sc-toggle>
      </div>

    </div>

    ${verbose ?
      html`
        <pre>
          <code>
  > player:
  ${JSON.stringify(data.player, null, 2)}
          </code>
          <code>
  ${data.session ? `> session: "${data.session.name}"` : null}
  ${data.session ? `> graph: \n${JSON.stringify(data.session.graph, null, 2)}` : null}
          </code>
        </pre>
      ` : ``}
  `;
}

