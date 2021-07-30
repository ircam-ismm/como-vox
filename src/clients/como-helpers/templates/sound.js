import {html} from 'lit-html';

import {displayToggle} from './displayToggle.js';
import {
  elementClasses,
  extraClasses,
  groupClasses,
} from './helpers.js';

const e = {};

export function sound(data) {
  const groupUi = data.metronomeSoundUi
        || data.beatingSoundUi
        || data.debugAudioUi
  ;
  const voxPlayerState = data.voxPlayerState;

  return (data.uiConfiguration || groupUi ? html`
      <div class="${groupClasses(data, 'sound', groupUi)}">
        ${data.uiConfiguration || groupUi ? html`
          <span class="title text ${extraClasses(groupUi)}">Écoute</span>
          ` : ''}

          ${data.uiConfiguration || data.metronomeSoundUi ? html`
          <span class="${elementClasses(data, 'metronomeSound')}">
            <button class="toggle ${data.metronomeSound ? 'selected' : ''}"
                    @click="${e => voxPlayerState.set({metronomeSound: !data.metronomeSound})}"
            >Métronome</button>
          ${data.uiConfiguration ? displayToggle(data, 'metronomeSoundUi') : ''}
        </span>
        ` : ''}

          ${data.uiConfiguration || data.beatingSoundUi ? html`
          <span class="${elementClasses(data, 'beatingSound')}">
            <button class="toggle ${data.beatingSound ? 'selected' : ''}"
                    @click="${e => voxPlayerState.set({beatingSound: !data.beatingSound})}"
            >Battue</button>
          ${data.uiConfiguration ? displayToggle(data, 'beatingSoundUi') : ''}
        </span>
        ` : ''}

          ${data.uiConfiguration || data.debugAudioUi ? html`
          <span class="${elementClasses(data, 'debugAudio')}">
            <button class="toggle ${data.debugAudio ? 'selected' : ''}"
                    @click="${e => voxPlayerState.set({debugAudio: !data.debugAudio})}"
            >Debug</button>
          ${data.uiConfiguration ? displayToggle(data, 'debugAudioUi') : ''}
        </span>
        ` : ''}


      </div>
      ` : '');
}
Object.assign(e, {sound});

export default e;
