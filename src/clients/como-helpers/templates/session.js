import { html } from 'lit-html';

import {displayToggle} from './displayToggle.js';
import {
  elementClasses,
  groupClasses,
} from './helpers.js';

const e = {};

export function session(data) {
  const groupUi = data.sessionNameUi
        || data.sessionSelectionUi
        || data.playerIdUi


  return (data.uiConfiguration || groupUi ? html`
      <div class="${groupClasses(data, 'session', groupUi)}">

        ${data.uiConfiguration || data.sessionNameUi ? html`
        <span class="${elementClasses(data, 'sessionName')}">
          <span class="text">Session : ${data.session.name}</span>
          ${data.uiConfiguration ? displayToggle(data, 'sessionNameUi') : ''}
        </span>
        `: ''}

        ${data.uiConfiguration || data.sessionSelectionUi ? html`
        <span class="${elementClasses(data, 'sessionSelection')}">
          <button class="trigger session"
                  @click="${async (e) => {
               await data.experience.coMoPlayer.player.set({sessionId: null});
            } }">
            Choisir session
          </button>
          ${data.uiConfiguration ? displayToggle(data, 'sessionSelectionUi') : ''}
        </span>
        `: ''}

        ${data.uiConfiguration || data.playerIdUi ? html`
        <span class="${elementClasses(data, 'playerId')}">
          <span class="text">Identifiant : ${data.player.id}</span>
          ${data.uiConfiguration ? displayToggle(data, 'playerIdUi') : ''}
        </span>
        `: ''}

      </div>
      ` : '');
}
Object.assign(e, {session});

export default e;
