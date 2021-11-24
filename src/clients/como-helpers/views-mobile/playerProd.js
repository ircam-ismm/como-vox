import { html, nothing } from 'lit-html';

// for dev purposes, to be removed
const localState = {
  showAdvancedSettings: false,
  showCalibrationScreen: false,
  calibrationScreenIndex: 1,
  showCreditsScreen: false,
};

export function playerProd(data) {
  return html`
    <header>
      <h1 class="title">
        <img src="./images/logo.png" alt="como vox" />
      </h1>
      <button
        class="settings-btn"
        @click="${e => {
          // console.log('show advanced options');
          // localState.showAdvancedSettings = !localState.showAdvancedSettings;
          // renderApp();
        }}"
      ></button>
    </header>
    <section id="main">
      <div >
      <!-- advanced options overlay -->
      ${localState.showAdvancedSettings ?
        html`
          <div class="settings">
            <div class="adjust-param param-nuance">
              <p>Ajuster la nuance</p>
              <div
                class="col-3"
                @click="${e => {
                  const buttons = e.currentTarget.querySelectorAll('button');
                  Array.from(buttons).forEach(b => b.classList.remove('selected'));
                  e.target.classList.add('selected');
                }}"
              >
                <button>-</button>
                <button>normal</button>
                <button>+</button>
              </div>
            </div>

            <div class="adjust-param param-tempo">
              <p>Ajuster le tempo</p>
              <div
                class="col-3"
                @click="${e => {
                  const buttons = e.currentTarget.querySelectorAll('button');
                  Array.from(buttons).forEach(b => b.classList.remove('selected'));
                  e.target.classList.add('selected');
                }}"
              >
                <button>-</button>
                <button>normal</button>
                <button>+</button>
              </div>
            </div>

            <hr />

            <div class="adjust-param param-calibration">
              <div class="col-1">
                <button
                  @click="${e => {
                    // localState.showAdvancedSettings = false;
                    // localState.showCalibrationScreen = true;
                    // localState.calibrationScreenIndex = 0;
                    // renderApp();
                  }}"
                >Calibrer</button>
              </div>
            </div>

            <div class="adjust-param param-latency">
              <div class="col-2">
                <p>Latence</p>
                <input type="number" value="42"
                  @click="${e => {
                    // localState.showAdvancedSettings = false;
                    // localState.showCalibrationScreen = true;
                    // localState.calibrationScreenIndex = 0;
                    // renderApp();
                  }}"
                />
              </div>
            </div>
          </div>
        `
      : nothing}

      <!-- advanced options overlay -->
      ${localState.showCalibrationScreen ?
        html`
          <div class="calibration">
            <h2>Calibration</h2>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
consequat.
            </p>
            ${localState.calibrationScreenIndex === 0 ?
              html`<div class="adjust-param param-calibration">
                <div class="col-1">
                  <button
                    class="color-binary"
                    @click="${e => {
                      // localState.calibrationScreenIndex = 1;
                      // renderApp();
                    }}"
                  >Commencer</button>
                  <button
                    class="color-secondary"
                    @click="${e => {
                      // localState.showCalibrationScreen = false;
                      // renderApp();
                    }}"
                  >Annuler</button>
                </div>
              </div>`
            : nothing}
            ${localState.calibrationScreenIndex === 1 ?
              html`
                <div class="adjust-param param-calibration">
                <div class="col-1">
                  <button
                    class="color-binary"
                    @click="${e => {
                      // localState.showCalibrationScreen = false;
                      // renderApp();
                    }}"
                  >Confirmer</button>
                  <button
                    class="color-secondary"
                    @click="${e => {
                      // localState.calibrationScreenIndex = 0;
                      // renderApp();
                    }}"
                  >Recommencer</button>
                </div>
              </div>
              `
            : nothing}
          </div>
        `
      : nothing}

      <!-- credits screen overlay -->
      ${localState.showCreditsScreen ?
        html`
          <div class="credits">
            <button
              class="close"
              @click="${e => {
                // localState.showCreditsScreen = false;
                // renderApp();
              }}"
            ></button>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
          </div>
        `
      : nothing}

      <!-- ---------------------------------- -->
      <!-- MAIN SCREEN                        -->
      <!-- ---------------------------------- -->

      <!-- choose track and preview -->
      <div class="track">
        <div class="select">
          <select>
            <option>my super track</option>
            <option>my super track 2</option>
          </select>
          <div class="select-arrow"></div>
        </div>
        <svg
          class="listen-track"
          viewbox="0 0 100 100"
          @click="${e => {
            e.currentTarget.classList.toggle('active');
            // renderApp();
          }}"
        >
          <polygon class="play-shape" points="20,15, 80,50, 20,85"></polygon>
          <polygon class="stop-shape" points="20,20, 80,20, 80,80, 20,80"></polygon>
        </svg>

        <p class="track-infos">
          4/4 - 80 à la noire
        </p>
      </div>

      <div class="exercise-type"
        @click="${e => {
          const buttons = e.currentTarget.querySelectorAll('button');
          Array.from(buttons).forEach(b => b.classList.remove('selected'));
          e.target.classList.add('selected');
        }}"
      >
        <button>Nuance</button>
        <button>Tempo</button>
        <button>Départ</button>
        <button class="all">Tutti !</button>
      </div>

      <div class="exercise-control">
        <svg
          class="button"
          viewbox="0 0 100 100"
          @click="${e => {
            e.currentTarget.classList.toggle('active');
            // renderApp();
          }}"
        >
          <polygon class="play-shape" points="30,20, 80,50, 30,80"></polygon>
          <polygon class="stop-shape" points="25,25, 75,25, 75,75, 25,75"></polygon>
        </svg>
      </div>

      <div class="tempo-current">
        <span class="label">Tempo courant</span>
        <span class="value">64</span>
      </div>
      <div class="tempo-reference">
        <span class="label">Tempo de référence</span>
        <input value="80" type="number" class="value" />
      </div>

      <div class="metronome">
        <span class="label">Metronome</span>
        <button
          @click="${e => {
            e.currentTarget.classList.toggle('active')
          }}"
          class="value"
        ></button>
      </div>
    </section>
    <footer
      @click="${e => {
        console.log('show credits screen');
        // localState.showCreditsScreen = !localState.showCreditsScreen;
        // renderApp();
      }}"
    ></footer>
`;
}
