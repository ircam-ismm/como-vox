import { html } from 'lit-html';
import * as styles from './styles.js'

export function sorry(data, listeners) {
  return html`<div>
    <h1 style="
        ${styles.h1}
        margin-top: 200px;
        margin-left: 20px;
      "
    >Désolé,</h1>
    <h3 style="
        ${styles.h3}
        margin-top: 30px;
        margin-left: 20px;
      "
    >${data.config.app.name} requiert l'access aux capteurs<br />de mouvement pour fonctionner</h3>
  </div>`
}
