import { html, nothing } from 'lit-html';

export function playerProd(data) {
  const guiState = data.guiState;
  const exp = data.experience;

  const voxApplicationState = data.voxApplicationState;
  const voxPlayerState = data.voxPlayerState;

  // @TODO
  // init?

  // data.scoreFileName
  const loading = data.scoreFileName && !data.scoreReady;

  return html`
    <header>
      <h1 class="title">
        <img src="./images/logo.png" alt="como vox" />
      </h1>
      <button
        class="settings-btn"
        @click="${e => {
          guiState.showAdvancedSettings = !guiState.showAdvancedSettings;
          exp.updateGuiState(guiState);
        }}"
      ></button>
    </header>
    <section id="main">
      <div >
      <!-- advanced options overlay -->
      ${guiState.showAdvancedSettings ?
        html`
          <div class="settings">
            <div class="adjust-param param-nuance">
              <p>Réactivité de la nuance</p>
              <div
                class="col-3"
                @click="${e => {
                  // @note - the buttons should be activated from the state
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
              <p>Réactivité du tempo</p>
              <div
                class="col-3"
                @click="${e => {
                  // @note - the buttons should be activated from the state
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
                    guiState.showAdvancedSettings = false;
                    guiState.showCalibrationScreen = true;
                    guiState.calibrationScreenIndex = 0;
                    exp.updateGuiState(guiState);
                  }}"
                >Calibrer</button>
              </div>
            </div>

            <div class="adjust-param param-latency">
              <div class="col-2">
                <p>Latence</p>
                <input type="number" value="42"
                  @blur="${e => {
                    const value = parseInt(e.currentTarget.value);
                    // do something w/ value
                  }}"
                />
              </div>
            </div>
          </div>
        `
      : nothing}

      <!-- advanced options overlay -->
      ${guiState.showCalibrationScreen ?
        html`
          <div class="calibration">
            <h2>Calibration</h2>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
consequat.
            </p>
            <div class="adjust-param param-calibration">
              <div class="col-1">
                <button
                  class="color-default"
                  @click="${e => {
                    e.target.classList.remove('color-default');
                    e.target.classList.add('color-process');
                    e.target.innerText = 'Calibration en cours...'

                    setTimeout(() => {
                      guiState.showCalibrationScreen = false;
                      exp.updateGuiState(guiState);
                    }, 3000);
                  }}"
                >Commencer</button>
                <button
                  class="color-white"
                  @click="${e => {
                    guiState.showCalibrationScreen = false;
                    exp.updateGuiState(guiState);
                  }}"
                >Annuler</button>
              </div>
            </div>
          </div>
        `
      : nothing}

      <!-- credits screen overlay -->
      ${guiState.showCreditsScreen ?
        html`
          <div class="credits">
            <button
              class="close"
              @click="${e => {
                guiState.showCreditsScreen = false;
                exp.updateGuiState(guiState);
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
          <select .value=${data.scoreFileName ? data.scoreFileName : 'none'}
                  @change="${e => {

                         const scoreFileName = (e.target.value === 'none' ? null : e.target.value);
                         voxPlayerState.set({scoreFileName});
                         }}"
          >
            ${['none', ...voxApplicationState.get('scores')].map( (scoreFileName) => {
            return html`
            <option
              .value=${scoreFileName}
              ?selected="${data.scoreFileName
                     === (scoreFileName === 'none' ? null : scoreFileName)}"
            >${scoreFileName === 'none' ? 'aucune' : scoreFileName}</option>
            `;
            })}
          </select>
          <div class="select-arrow"></div>
        </div>
        <svg
          class="listen-track"
          viewbox="0 0 100 100"
          @click="${e => {
            e.currentTarget.classList.toggle('active');
            exp.updateGuiState(guiState);
          }}"
        >
          <polygon class="play-shape" points="20,15, 80,50, 20,85"></polygon>
          <polygon class="stop-shape" points="20,20, 80,20, 80,80, 20,80"></polygon>
        </svg>

        <p class="track-infos">
          ${data.score
            ? `${data.timeSignature.count}/${data.timeSignature.division} - ${data.score.metas.tempo} à la noire`
            : ''}
        </p>
      </div>

      <div class="exercise-type"
        @click="${e => {
          // @note - the buttons should be activated from the state
          const buttons = e.currentTarget.querySelectorAll('button');
          Array.from(buttons).forEach(b => b.classList.remove('selected'));
          e.target.classList.add('selected');
        }}"
      >
        <button>Nuance</button>
        <button>Tempo</button>
        <button>Tempo & Nuance</button>
        <button>Départ</button>
      </div>

      <div class="exercise-control">
        <svg
          class="button"
          viewbox="0 0 100 100"
          @click="${e => {
            e.currentTarget.classList.toggle('active');
            exp.updateGuiState(guiState);
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
        guiState.showCreditsScreen = !guiState.showCreditsScreen;
        exp.updateGuiState(guiState);
      }}"
    ></footer>
`;
}
