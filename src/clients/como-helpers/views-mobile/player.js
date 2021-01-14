import { html } from 'lit-html';
import * as styles from './styles.js';

function getTimeSignature (event) {
  const parentElement = event.srcElement.parentElement;
  const count = parseFloat(parentElement.querySelector('.count').value) || 4;
  const division = parseFloat(parentElement.querySelector('.division').value) || 4;
  return {count, division};
}

function getPosition (event) {
  const parentElement = event.srcElement.parentElement;
  let bar = parseFloat(parentElement.querySelector('.bar').value) || 1;
  if(bar <= 0) {
    bar += 1;
  }
  const beat = parseFloat(parentElement.querySelector('.beat').value) || 1;
  return {bar, beat};
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
  const voxApplicationState = data.voxApplicationState;
  const voxPlayerState = data.voxPlayerState;

  const bar = data.position.bar;
  const beat = data.position.beat;

  return html`
    <!-- LOADER -->
    ${data.player.loading ?
      html`<div style="${styles.loadingBanner}">loading...</div>` : ''
    }
    <!-- HEADER -->

    <div style="position: relative">
      <span class="info">
        <span style="${styles.h3}" class="session">Session: ${data.session.name}</span>
        <span style="${styles.h3}" class="session">PlayerId: ${data.player.id}</span>
      </span>

      ${enableSelection ?
        html`
          <button class="setSession"
            @click="${e => listeners.setPlayerParams({ sessionId: null })}">
            change session
          </button>
        ` : ``
      }
    </div>

    <div class="sensorsLatency">Sensors Latency:
      <input type="number"
             min="0"
             max="100"
             step="5"
             value="${data.sensorsLatency * 1e3}"
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
             value="${data.audioLatency * 1e3}"
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
             value="${data.lookAheadBeats}"
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

    <div class="score-container">
      <select class="${!experience.scoreReady ? 'invalid' : ''}"
        @change="${e => {
          const score = (e.target.value === 'none' ? null : e.target.value);
          voxPlayerState.set({score});
        }}"
      >
        ${['none', ...voxApplicationState.get('scores')].map( (score) => {
        return html`
        <option
          value="${score}"
          ?selected="${voxPlayerState.get('score')
            === (score === 'none' ? null : score)}"
        >${score}</option>
        `;
        })}
     </select>
    </div>

    <div class="tempo">Tempo:
      <input type="number"
             min="10"
             max="300"
             step="10"
             value="${Math.round(data.tempo)}"
             @click="${e => selfSelect(e)}"
             @change="${e => {
                   experience.setTempo(parseFloat(e.srcElement.value) || 60);
                   } }">
      from score:
      <sc-toggle
        .active="${data.tempoFromScore}"
        @change="${e => experience.setTempoFromScore(e.detail.value)}"
      ></sc-toggle>


    </div>

    <div class="timeSignature">Time signature:
      <input class="count"
             type="number"
             min="1"
             max="32"
             step="1"
             value="${data.timeSignature.count}"
             @click="${e => selfSelect(e)}"
             @change="${e => experience.setTimeSignature(getTimeSignature(e) )}">
      /
      <input class="division"
             type="number"
             min="1"
             max="32"
             step="1"
             value="${data.timeSignature.division}"
             @click="${e => selfSelect(e)}"
             @change="${e => experience.setTimeSignature(getTimeSignature(e) )}">

      from score:
      <sc-toggle
        .active="${data.timeSignatureFromScore}"
        @change="${e => experience.setTimeSignatureFromScore(e.detail.value)}"
      ></sc-toggle>
    </span>

    <div class="controls-container">

      <div class="onoff transport">Playback:
        <sc-toggle
          .active="${data.transportPlayback}"
          @change="${e => experience.setTransportPlayback(e.detail.value)}"
        ></sc-toggle>
      </div>

    </div>

    <div class="position">Position:
      ${[{bar: -1, beat: 1},
         {bar: 0, beat: 1},
         {bar: 1, beat: 1}].map( (position) => {
           return html`
      <button class="seek"
              @click="${e => experience.seekPosition(position)}">
        Seek to ${position.bar < 1
                  // display for bar < 1 with -1 offset
                  ? position.bar - 1
                  : position.bar }:${position.beat}
      </button>
`;})}

      <input class="time bar"
             type="number"
             step="1"
             value="${!data.position
                       ? 0
                       : (data.position.bar > 0
                          ? data.position.bar
                          : data.position.bar - 1)}"
             @click="${e => selfSelect(e)}"
             @change="${e => experience.seekPosition(getPosition(e) )}"
      >:<input class="time beat"
               type="number"
               step="1"
               min"1"
               value="${!data.position
                         ? 0
                         : Math.floor(beat)}"
               @click="${e => selfSelect(e)}"
               @change="${e => experience.seekPosition(getPosition(e) )}"
        >
    </div>

    <div class="controls-container">

      <div class="onoff beating audio">Gesture controls beat:
        <sc-toggle
          .active="${data.gesture.controlsBeat}"
          @change="${e => experience.setGestureControlsBeat(e.detail.value)}"
        ></sc-toggle>
      </div>

      <div class="onoff beating audio">Gesture controls tempo:
        <sc-toggle
          .active="${data.gesture.controlsTempo}"
          @change="${e => experience.setGestureControlsTempo(e.detail.value)}"
        ></sc-toggle>
      </div>

      <div class="onoff metronome audio">Metronome sound:
        <sc-toggle
          .active="${data.metronomeSound.onOff}"
          @change="${e => experience.setMetronomeSound(e.detail.value)}"
        ></sc-toggle>
      </div>

      <div class="onoff beating audio">Beating sound:
        <sc-toggle
          .active="${data.beatingSound.onOff}"
          @change="${e => experience.setBeatingSound(e.detail.value)}"
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

