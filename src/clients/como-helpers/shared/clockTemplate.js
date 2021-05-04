import { html } from 'lit-html';

const e = {};

export function clock(data) {
  const groupUi = data.clockTimeUi;

  return (groupUi ? html`
      <div class="group clock">
        ${data.clockTimeUi ? html`
        <span class="element time">
          ${data.syncTime.toFixed(3)}
        </span>
        `: ''}
      </div>
      ` : '');
}
Object.assign(e, {clock});

export default e;
