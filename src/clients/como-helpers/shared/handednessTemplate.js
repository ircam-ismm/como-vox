import { html } from 'lit-html';

const e = {};

export function handedness(data) {
  const groupUi = data.handednessUi;
  const voxPlayerState = data.voxPlayerState;

  return (groupUi ? html`
      <div class="group handedness">
        ${data.handednessUi ? html`
        <span class="element handedness">
          Main utilisée :
          ${ ['left', 'right'].map( (handedness) => {
            return html`
          <button class="set handedness ${data.handedness === handedness
                                          ? 'selected' : ''}"
                  @click="${e => voxPlayerState.set({handedness}) }">
            ${handedness === 'left' ? 'Gauche' : 'Droite'}
          </button>
            `;}) }
        </span>
        `: ''}
      </div>
      ` : '');
}
Object.assign(e, {handedness});

export default e;
