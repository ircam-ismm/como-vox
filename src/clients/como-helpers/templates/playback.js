import { html } from 'lit-html';

import {displayToggle} from './displayToggle.js';
import {
  elementClasses,
  extraClasses,
  getBarBeat,
  groupClasses,
  selfSelect,
} from './helpers.js';

const e = {};

export function playback(data) {
  const groupUi = data.playbackUi
        || data.gestureControlsPlaybackStartUi
        || data.gestureControlsPlaybackStopUi
        || data.playbackStartAfterCountUi
        || data.playbackStopAfterCountUi
        || data.playbackStopSeekUi
  ;

  const startGroupUi = data.gestureControlsPlaybackStartUi
        || data.playbackStartAfterCountUi;

  const stopGroupUi = data.gestureControlsPlaybackStopUi
        || data.playbackStopAfterCountUi;

  const voxPlayerState = data.voxPlayerState;

  return (data.uiConfiguration || groupUi ? html`
      <div class="${groupClasses(data, 'playback', groupUi)}">

        ${data.uiConfiguration || data.playbackUi ? html`
          <span class="${elementClasses(data, 'playback')}">
          <span class="selection">
          ${ [ [false, 'Stop'],
               [true, 'Lecture'],
             ].map( ([onOff, display]) => {
            return html`
            <button class="option playback ${data.playback === onOff
                           ? 'selected on' : 'off'}"
                    @click="${e => voxPlayerState.set({playback: (onOff)})}">
              ${display}
            </button>
            `;
            }) }
          </span>
          ${data.uiConfiguration ? displayToggle(data, 'playbackUi') : ''}
        </span>
        ` : ''}

        ${data.uiConfiguration || data.playbackStopSeekUi ? html`
        <span class="${elementClasses(data, 'playbackStopSeek')}">
          <span class="text">Reprise</span>
          <span class="selection">
            ${[ ['start', 'Début'],
                ['barStart', 'Mesure'],
                [null, 'Pause'],
              ].map( ([seek, display]) => {
              return html`
            <button class="option playbackStopSeek ${data.playbackStopSeek === seek
                         ? 'selected' : ''}"
                  @click="${e => voxPlayerState.set({playbackStopSeek: seek}) }">
              ${display}
            </button>
          `;
          }) }
          </span>
        ${data.uiConfiguration ? displayToggle(data, 'playbackStopSeekUi') : ''}
        </span>
        ` : ''}

        ${data.uiConfiguration || startGroupUi ? html`
        <div class="group start">

          <span class="text ${extraClasses(startGroupUi)}"
          >Départ</span>

          ${data.uiConfiguration || data.gestureControlsPlaybackStartUi ? html`
          <span class="${elementClasses(data, 'gestureControlsPlaybackStart')}">

            <span class="selection">
              ${[ [false, 'Libre'],
                  [true, 'Geste']
                ].map( ([onOff, display]) => {
                return html`
              <button class="option gestureControlsPlaybackStart ${data.gestureControlsPlaybackStart === onOff
                         ? 'selected' : ''}"
                      @click="${e => voxPlayerState.set({gestureControlsPlaybackStart: (onOff)})}">
              ${display}
              </button>
              `;
              }) }
            </span>
            ${data.uiConfiguration ? displayToggle(data, 'gestureControlsPlaybackStartUi') : ''}
          </span>
          ` : ''}

          ${data.uiConfiguration || data.playbackStartAfterCountUi ? html`
          <span class="${elementClasses(data, 'playbackStartAfterCount')}">
            <span class="text">après</span>
            <span class="playbackStartAfterCount valueUnit">
              <input class="bar"
                     type="number"
                     min="0"
                     max="3"
                     step="1"
                     .value=${data.playbackStartAfterCount.bar}
                     @click="${e => selfSelect(e)}"
                     @change="${e => voxPlayerState.set({playbackStartAfterCount: (getBarBeat(e) )}) }">
              <span class="text">
                mesure${data.playbackStartAfterCount.bar > 1 ? 's' : ''}
              </span>
            </span>
            <span class="playbackStartAfterCount valueUnit">
              <input class="beat"
                     type="number"
                     min="0"
                     max="16"
                     step="1"
                     .value=${data.playbackStartAfterCount.beat}
                     @click="${e => selfSelect(e)}"
                     @change="${e => voxPlayerState.set({playbackStartAfterCount: (getBarBeat(e) )}) }">
              <span class="text">temps</span>
            </span>
            ${data.uiConfiguration ? displayToggle(data, 'playbackStartAfterCountUi') : ''}
          </span>
          ` : ''}

        </div>
        ` :  ''}

        ${data.uiConfiguration || stopGroupUi ? html`
        <div class="group stop">

          <span class="text ${extraClasses(stopGroupUi)}"
          >Arrêt</span>

          ${data.uiConfiguration || data.gestureControlsPlaybackStopUi ? html`
          <span class="${elementClasses(data, 'gestureControlsPlaybackStop')}">

            <span class="selection">
              ${[ [false, 'Libre'],
                  [true, 'Geste']
                ].map( ([onOff, display]) => {
                return html`
              <button class="option gestureControlsPlaybackStop ${data.gestureControlsPlaybackStop === onOff
                         ? 'selected' : ''}"
                      @click="${e => voxPlayerState.set({gestureControlsPlaybackStop: (onOff)})}">
              ${display}
              </button>
              `;
              }) }
            </span>
            ${data.uiConfiguration ? displayToggle(data, 'gestureControlsPlaybackStopUi') : ''}
          </span>
          ` : ''}

          ${data.uiConfiguration || data.playbackStopAfterCountUi ? html`
          <span class="${elementClasses(data, 'playbackStopAfterCount')}">
            <span class="text">après</span>
            <span class="playbackStopAfterCount valueUnit">
              <input class="bar"
                     type="number"
                     min="0"
                     max="3"
                     step="1"
                     .value=${data.playbackStopAfterCount.bar}
                     @click="${e => selfSelect(e)}"
                     @change="${e => voxPlayerState.set({playbackStopAfterCount: (getBarBeat(e) )}) }">
              <span class="text">
                mesure${data.playbackStopAfterCount.bar > 1 ? 's' : ''}
              </span>
            </span>
            <span class="playbackStopAfterCount valueUnit">
              <input class="beat"
                     type="number"
                     min="0"
                     max="16"
                     step="1"
                     .value=${data.playbackStopAfterCount.beat}
                     @click="${e => selfSelect(e)}"
                     @change="${e => voxPlayerState.set({playbackStopAfterCount: (getBarBeat(e) )}) }">
              <span class="text">temps</span>
            </span>
            ${data.uiConfiguration ? displayToggle(data, 'playbackStopAfterCountUi') : ''}
          </span>
          ` : ''}

          </div>
        ` :  ''}

      </div>
      ` : '');
}
Object.assign(e, {playback});

export default e;
