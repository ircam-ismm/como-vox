import { LitElement, html, css } from 'lit-element';

class CoMoteIntensity extends LitElement {
  static get properties() {
    return {
      width: {
        type: Number,
      },
      height: {
        type: Number,
      },
      duration: {
        type: Number,
      },
      min: {
        type: Number,
      },
      max: {
        type: Number,
        reflect: true,
      },
      colors: {
        type: Array,
      },
      lineWidth: {
        type: Number,
        reflect: true,
        attribute: 'line-width',
      },
      displayMinMax: {
        type: Boolean,
        attribute: 'display-min-max',
        reflect: true,
      },
    };
  }

  static get styles() {
    return css`
      :host {
        vertical-align: top;
        display: inline-block;
        box-sizing: border-box;
        background-color: white;
        line-height: 0;
        outline: 1px solid #676768;
        position: relative;
        background-color: white;
      }
      canvas {
        margin: 0;
      }
    `;
  }

  constructor() {
    super();

    this.source = null;
    this.lastEvent = null;

    this.frameCount = 0;
    this.frameModulo = 4;

    this._renderSignal = this._renderSignal.bind(this);
  }

  render() {
    return html`
      <div>
        <canvas
          style="
            width: ${this.width}px;
            height: ${this.height}px;
          "
        ></canvas>
      </div>
    `;
  }

  firstUpdated() {
    const scale = window.devicePixelRatio;

    this.canvas = this.shadowRoot.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.canvas.width = this.width;
    this.ctx.canvas.height = this.height;

    console.log(this.source);

    super.firstUpdated();
  }

  connectedCallback() {
    super.connectedCallback();

    this.removeSourceListener = this.source.addListener(e => {
      this.lastEvent = e;
    });

    this.rAFId = window.requestAnimationFrame(this._renderSignal);
  }

  disconnectedCallback() {
    window.cancelAnimationFrame(this.rAFId);

    this.removeSourceListener()

    this.ctx.clearRect(0, 0, this.width, this.height);

    super.disconnectedCallback();
  }

  _renderSignal() {
    if (this.frameCount === 0 && this.lastEvent) {
      let { alpha, beta, gamma } = this.lastEvent.rotationRate;
      alpha /= 360;
      beta /= 360;
      gamma /= 360;
      const max = Math.max(alpha, Math.max(beta, gamma));
      const height = max * this.height;

      this.ctx.fillStyle = '#000000';
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.ctx.fillRect(0, this.height - height, this.width, height);
    }

    this.frameCount = (this.frameCount + 1) % this.frameModulo;

    this.rAFId = window.requestAnimationFrame(this._renderSignal);
  }
}

customElements.define('comote-intensity', CoMoteIntensity);

export default CoMoteIntensity;
