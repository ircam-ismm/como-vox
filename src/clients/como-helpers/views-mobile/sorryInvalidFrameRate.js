import { html } from 'lit-html';
import * as styles from './styles.js'

export function sorryInvalidFrameRate(data, listeners) {
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
    >
      Le taux de rachaichissement des capteurs<br />
      est trop bas pour le bon fonctionnement<br />
      de l'application<br />
      <br />
      Merci d'essayer en utilisant Google Chrome
    </h3>
  </div>`
}
