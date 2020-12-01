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

    <div class="test">

      <div class="test constant">Test constant: ${data.constant}</div>

      <button
        style="
          ${styles.button}
          margin: 0;
        "
        @click="${e => listeners.setConstant()}">
        Update constant param
      </button>

      <div class="test constant">Test constant2: ${data.constant2}</div>

      <button
        style="
          ${styles.button}
          margin: 0;
        "
        @click="${e => listeners.setConstant2()}">
        Update constant2 param
      </button>

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

