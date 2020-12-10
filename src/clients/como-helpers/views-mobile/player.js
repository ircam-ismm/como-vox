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
  return html`
    <!-- LOADER -->
    ${data.player.loading ?
      html`<div style="${styles.loadingBanner}">loading...</div>` : ''
    }

    <!-- HEADER -->
    <h2 style="${styles.h2}">
      <div>PlayerId: ${data.player.id}</div><br>
      <div>Session: ${data.session.name}</div>
    </h2>

    <div style="position: relative; min-height: 50px">
      <h3 style="${styles.h3}">PlayerId: ${data.player.id}</h3>

      ${enableSelection ?
        html`
          <button
            style="
              ${styles.button}
              width: 200px;
              position: absolute;
              top: 0px;
              right: 0px;
              margin: 0;
            "
            @click="${e => listeners.setPlayerParams({ sessionId: null })}">
            change session
          </button>
        ` : ``
      }
    </div>

    <div class="audioLatency">Audio Latency:
      <input type="number"
             min="0"
             max="500"
             step="10"
             .value="${data.audioLatency * 1e3}"
             @click="${e => selfSelect(e)}"
             @change="${e => {
                   listeners.setAudioLatency(parseFloat(e.srcElement.value * 1e-3) || 0);
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
                   listeners.setLookAheadBeats(parseFloat(e.srcElement.value) || 0);
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
                   listeners.setTempo(parseFloat(e.srcElement.value) || 60);
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
             @change="${e => listeners.setTimeSignature(getTimeSignature(e) )}">
      /
      <input class="division"
             type="number"
             min="1"
             max="32"
             step="1"
             .value="${data.timeSignature.division}"
             @click="${e => selfSelect(e)}"
             @change="${e => listeners.setTimeSignature(getTimeSignature(e) )}">
    </div>

    <div class="position">Position: <span class="time">${data.position
      ? `${data.position.bar}/${data.position.beat.toFixed(2)}`
      : '?/?'}<span></div>

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

