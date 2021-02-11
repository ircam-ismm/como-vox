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
  const ui = data.ui;

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
        ${ui.preset === 'full' ? html`
        <span style="${styles.h3}" class="session">Session: ${data.session.name}</span>
        `: ''}
        <span style="${styles.h3}" class="session">PlayerId: ${data.player.id}</span>
      </span>

      ${ui.preset === 'full' && enableSelection ? html`
      <button class="setSession"
              @click="${e => listeners.setPlayerParams({ sessionId: null })}">
        change session
      </button>
      ` : ''}
    </div>

    <div class="audioLatency">Audio Latency:
      <input type="number"
             min="0"
             max="500"
             step="10"
             .value=${data.audioLatency * 1e3}
             @click="${e => selfSelect(e)}"
             @change="${e => {
                   experience.setAudioLatency(parseFloat(e.srcElement.value * 1e-3) || 0);
                   } }">
      ms
    </div>

    ${ui.preset === 'full' ? html`
    <div class="lookAhead">Look-ahead:
      <input type="number"
             min="0"
             max="32"
             step="0.125"
             .value=${data.lookAheadNotes * 8}
             @click="${e => selfSelect(e)}"
             @change="${e => {
                   experience.setLookAheadNotes(parseFloat(e.srcElement.value / 8) || 0);
                   } }">
      eight note${data.lookAheadNotes > 1 ? 's' : ''}
      (${data.lookAheadBeats} beat${data.lookAheadBeats > 1 ? 's' : ''},
      ${Math.round(data.lookAheadSeconds * 1e3)} ms)
    </div>
    ` : '' }

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
          .value=${score}
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
             .value=${
             // tempo for quarter-note
             Math.round(data.tempo * data.timeSignature.division / 4)}
             @click="${e => selfSelect(e)}"
             @change="${e => {
                   // tempo for quarter-note
                   experience.setTempo(parseFloat(
                   e.srcElement.value * 4 / data.timeSignature.division) || 60); } }">

      ${ui.preset === 'full' ? html`
      from score:
      <sc-toggle
        .active="${data.tempoFromScore}"
        @change="${e => experience.setTempoFromScore(e.detail.value)}"
      ></sc-toggle>
      ` : ''}

    </div>

    <div class="timeSignature">Time signature:
      <input class="count"
             type="number"
             min="1"
             max="32"
             step="1"
             .value=${data.timeSignature.count}
             @click="${e => selfSelect(e)}"
             @change="${e => experience.setTimeSignature(getTimeSignature(e) )}">
      /
      <input class="division"
             type="number"
             min="1"
             max="32"
             step="1"
             .value=${data.timeSignature.division}
             @click="${e => selfSelect(e)}"
             @change="${e => experience.setTimeSignature(getTimeSignature(e) )}">
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
      ${ui.preset === 'full' ? html`
      ${[{bar: -1, beat: 1},
         {bar: 0, beat: 1},
         {bar: 1, beat: 1}].map( (position) => {
           return html`
      <button class="seek"
              @click="${e => experience.seekPosition(position)}">
        Seek to ${position.bar < 1
        // display for bar < 1 with -1 offset
        ? position.bar - 1
        : position.bar }
      </button>
      `;})}
    ` : html`
      <button class="seek"
              @click="${e => experience.seekPosition({bar: 1, beat: 1})}">
        Restart</button>
    `}

      <input class="time bar"
             type="number"
             step="1"
             .value=${!data.position
             ? 0
             : (data.position.bar > 0
      ? data.position.bar
      : data.position.bar - 1)}
      @click="${e => selfSelect(e)}"
      @change="${e => experience.seekPosition(getPosition(e) )}"
      >${ui.preset === 'full' ? html`
      :<input class="time beat"
             type="number"
             step="1"
             min"1"
             .value=${!data.position
             ? 0
             : Math.floor(beat)}
             @click="${e => selfSelect(e)}"
             @change="${e => experience.seekPosition(getPosition(e) )}"
      >
      ` : ''}
    </div>

    <div class="controls-container">

      ${ui.preset === 'full' ? html`
      <div class="onoff beating audio">Gesture controls beat:
        <sc-toggle
          .active="${data.gesture.controlsBeatOffset}"
          @change="${e => experience.setGestureControlsBeatOffset(e.detail.value)}"
        ></sc-toggle>
      </div>

      <div class="onoff beating audio">Gesture controls tempo:
        <sc-toggle
          .active="${data.gesture.controlsTempo}"
          @change="${e => experience.setGestureControlsTempo(e.detail.value)}"
        ></sc-toggle>
      </div>
      ` : html`
      <div class="onoff beating audio">Gesture controls tempo:
        <sc-toggle
          .active="${data.gesture.controlsTempo}"
          @change="${e => {
                        experience.setGestureControlsTempo(e.detail.value)
                        experience.setGestureControlsBeatOffset(e.detail.value)
                     }
                   }"
        ></sc-toggle>
      </div>
      `}
      <div class="onoff beating audio">Gesture controls intensity:
        <sc-toggle
          .active="${data.gesture.controlsIntensity}"
          @change="${e => experience.setGestureControlsIntensity(e.detail.value)}"
        ></sc-toggle>
      </div>

      <div class="onoff metronome audio">Metronome sound:
        <sc-toggle
          .active="${data.metronomeSound.onOff}"
          @change="${e => experience.setMetronomeSound(e.detail.value)}"
        ></sc-toggle>
      </div>

      ${ui.preset === 'full' ? html`
      <div class="onoff beating audio">Beating sound:
        <sc-toggle
          .active="${data.beatingSound.onOff}"
          @change="${e => experience.setBeatingSound(e.detail.value)}"
        ></sc-toggle>
      </div>
      ` : ''}
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

