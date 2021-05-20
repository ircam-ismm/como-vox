import { html } from 'lit-html';

const e = {};

export function displayToggle(data, element) {
  const voxPlayerState = data.voxPlayerState;

  return html`
        <button class="toggle display ${data[element] ? 'selected' : ''}"
                @click="${e => voxPlayerState.set({[element]: !data[element]}) }">
          Affichage
        </button>
`;
}
Object.assign(e, {displayToggle});

export default e;
