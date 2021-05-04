import { html } from 'lit-html';

const e = {};

export function session(data) {
  const groupUi = data.sessionIdUi
        || data.playerIdUi
        || data.sessionNameUi
  ;

  return (groupUi ? html`
      <div class="group session">
        ${data.sessionNameUi ? html`
        <span class="element sessionName">Session : ${data.session.name}</span>
        `: ''}

        ${data.playerIdUi ? html`
        <span class="element playerId">Identifiant : ${data.player.id}</span>
        `: ''}

        ${data.sessionSelectionUi ? html`
        <span class="element sessionSelection">
          <button class="trigger"
                  @click="${async (e) => {
               await data.player.set( {sessionId: null} );
            } }">
            Choisir session
          </button>
        </span>
        `: ''}

      </div>
      ` : '');
}
Object.assign(e, {session});

export default e;
