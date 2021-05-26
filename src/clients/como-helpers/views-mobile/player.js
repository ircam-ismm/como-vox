import {html} from 'lit-html';

import {player as playerTemplate} from '../templates/player.js';

export function player(data, listeners, {
} = {}) {
  const voxApplicationState = data.voxApplicationState;
  const voxPlayerState = data.voxPlayerState;
  const uiPreset = data.uiPreset;

  const bar = data.position.bar;
  const beat = data.position.beat;

  return html`
    <div class="mobile player">
      <!-- LOADER -->
      ${data.player.loading
        ? html`<div class="loadingBanner">Chargement...</div>`
        : ''}

      ${playerTemplate(data)}

    </div>  `;
}

