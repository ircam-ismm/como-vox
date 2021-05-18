import { html } from 'lit-html';

import {displayToggle} from './displayToggleTemplate.js';

const e = {};

export function session(data) {
  const groupUi = data.uiConfiguration
        || data.sessionIdUi
        || data.playerIdUi
        || data.sessionNameUi
  ;

  return (groupUi ? html`
      <div class="group session">
        ${data.uiConfiguration || data.sessionNameUi ? html`
        <span class="element sessionName">
          <span class="text">Session : ${data.session.name}</span>
          ${data.uiConfiguration ? displayToggle(data, 'sessionNameUi') : ''}
        </span>
        `: ''}

        ${data.uiConfiguration || data.playerIdUi ? html`
        <span class="element playerId">
          <span class="text">Identifiant : ${data.player.id}</span>
          ${data.uiConfiguration ? displayToggle(data, 'playerIdUi') : ''}
        </span>
        `: ''}

        ${data.uiConfiguration || data.sessionSelectionUi ? html`
        <span class="element sessionSelection">
          <button class="trigger session"
                  @click="${async (e) => {
               await data.player.set( {sessionId: null} );
            } }">
            Choisir session
          </button>
          ${data.uiConfiguration ? displayToggle(data, 'sessionSelectionUi') : ''}
        </span>
        `: ''}

      </div>
      ` : '');
}
Object.assign(e, {session});

export default e;
