import {html} from 'lit-html';

import {displayToggle} from './displayToggle.js';
import {
  elementClasses,
  extraClasses,
  groupClasses,
} from './helpers.js';

const e = {};

export function scenario(data) {
  const groupUi = data.scenarioStartStopWithBeatingUi;
  const voxPlayerState = data.voxPlayerState;

  return (data.uiConfiguration || groupUi ? html`
      <div class="${groupClasses(data, 'scenario', groupUi)}">
        ${data.uiConfiguration || groupUi ? html`
          <span class="text ${extraClasses(groupUi)}">Scénario</span>
          ` : ''}

          ${data.uiConfiguration || data.scenarioStartStopWithBeatingUi ? html`
          <span class="${elementClasses(data, 'scenarioStartStopWithBeating')}">


            <button class="toggle scenario ${data.scenarioCurrent === 'scenarioStartStopWithBeating' ? 'selected' : ''}"
                  @click="${e => {
                     if(data.scenarioCurrent !== 'scenarioStartStopWithBeating') {
                       voxPlayerState.set({scenarioStartStopWithBeating: true});
                     } else {
                       voxPlayerState.set({playback: false});
                       voxPlayerState.set({scenarioStartStopWithBeating: false});
                     }
                  } }"
            >Départ</button>

            ${data.uiConfiguration
              ? displayToggle(data, 'scenarioStartStopWithBeatingUi')
              : ''}
        </span>
        ` : ''}

      </div>
      ` : '');
}
Object.assign(e, {scenario});

export default e;
