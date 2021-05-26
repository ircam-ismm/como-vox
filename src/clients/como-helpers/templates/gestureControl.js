import {html} from 'lit-html';

import {displayToggle} from './displayToggle.js';
import {
  elementClasses,
  extraClasses,
  groupClasses,
} from './helpers.js';

const e = {};

export function gestureControl(data) {
  const groupUi = data.gestureControlsBeatOffsetUi
        || data.gestureControlsTempoUi
        || data.gestureControlsIntensityUi
  ;
  const voxPlayerState = data.voxPlayerState;

  return (data.uiConfiguration || groupUi ? html`
      <div class="${groupClasses(data, 'gestureControl', groupUi)}">
        ${data.uiConfiguration || groupUi ? html`
          <span class="text ${extraClasses(groupUi)}">Contrôle</span>
          ` : ''}

          ${data.uiConfiguration || data.gestureControlsIntensityUi ? html`
          <span class="${elementClasses(data, 'gestureControlsIntensity')}">

            <button class="toggle ${data.gestureControlsIntensity ? 'selected' : ''}"
                    @click="${e => voxPlayerState.set({gestureControlsIntensity: !data.gestureControlsIntensity})}"
            >Dynamique</button>
          ${data.uiConfiguration ? displayToggle(data, 'gestureControlsIntensityUi') : ''}
        </span>
        ` : ''}

          ${data.uiConfiguration || data.gestureControlsTempoUi ? html`
          <span class="${elementClasses(data, 'gestureControlsTempo')}">
            <button class="toggle ${(data.gestureControlsBeatOffset && data.gestureControlsTempo) ? 'selected' : ''}"
                    @click="${e => {
                         const onOff = !(data.gestureControlsBeatOffset && data.gestureControlsTempo);
                         voxPlayerState.set({
                           gestureControlsBeatOffset: onOff,
                           gestureControlsTempo: onOff,
                         });
                       } }"
            >Tempo</button>
          ${data.uiConfiguration ? displayToggle(data, 'gestureControlsTempoUi') : ''}
        </span>
        ` : ''}

      </div>
      ` : '');
}
Object.assign(e, {gestureControl});

export default e;
