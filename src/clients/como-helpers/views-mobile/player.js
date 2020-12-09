import { html } from 'lit-html';
import * as styles from './styles.js';

export function player(data, listeners, {
  verbose = false,
  enableSelection = true,
} = {}) {
  return html`
    <!-- LOADER -->
    ${data.player.loading ?
      html`<div style="${styles.loadingBanner}">loading...</div>` : ''
    }

    <!-- HEADER -->
    <h2 style="${styles.h2}">
      <div>PlayerId: ${data.player.id}</div><br>
      <div>Session: ${data.session.name}</div>
    </h2>

    <div style="position: relative; min-height: 50px">
      <h3 style="${styles.h3}">PlayerId: ${data.player.id}</h3>

      ${enableSelection ?
        html`
          <button
            style="
              ${styles.button}
              width: 200px;
              position: absolute;
              top: 0px;
              right: 0px;
              margin: 0;
            "
            @click="${e => listeners.setPlayerParams({ sessionId: null })}">
            change session
          </button>
        ` : ``
      }
    </div>

    <div class="time">
      ${data.syncTime}
    </div>

    <div class="timeSignature">Time signature: ${data.timeSignature
      ? `${data.timeSignature.count} / ${data.timeSignature.division}`
      : '? / ?'}</div>

    <div class="tempo">Tempo: ${data.tempo
      ? `${data.tempo}`
      : '?'}</div>

    <div class="position">Position: ${data.position
      ? `${data.position.bar} / ${data.position.beat}`
      : '? / ?'}</div>

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

