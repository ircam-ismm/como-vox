import { html, nothing } from 'lit-html';

export function playerProd(data) {
  const guiState = data.guiState;
  const exp = data.experience;

  const voxApplicationState = data.voxApplicationState;
  const voxPlayerState = data.voxPlayerState;
  const loading = data.scoreFileName && !data.scoreReady;

  const scoreTempo = (data.scoreData
                      ? Math.round(data.scoreData.masterTrack.tempo
                                   * data.scoreData.masterTrack.timeSignature.division / 4)
                      : 0);
  let scoreDivisionName = 'noire';

  if (data.scoreData) {
    switch(data.scoreData.masterTrack.timeSignature.division) {
      case 1:
        scoreDivisionName = 'ronde';
        break;
      case 2:
        scoreDivisionName = 'blanche';
        break;
      case 4:
        scoreDivisionName = 'noire';
        break;
      case 8:
        scoreDivisionName = 'croche';
        break;
      case 16:
        scoreDivisionName = 'double-croche';
        break;
    }
  }

  return html`
    <header>
      <h1 class="title">
        <img src="./images/logo.png" alt="como vox" />
      </h1>
      <button
        class="settings-btn${guiState.showAdvancedSettings ? ' active' : ''}"
        @click="${e => {
          if (loading || guiState.showCalibrationScreen) {
            return;
          }
          guiState.showAdvancedSettings = !guiState.showAdvancedSettings;
          exp.updateGuiState(guiState);
        }}"
      ></button>
    </header>

    <section>
      <!-- ---------------------------------- -->
      <!-- LOADING OVERLAY                    -->
      <!-- ---------------------------------- -->
      ${loading
        ? html`<div class="loading"></div>`
        : nothing
      }

      <!-- ---------------------------------- -->
      <!-- ADVANCED SETTINGS MENU             -->
      <!-- ---------------------------------- -->
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
                ${Object.entries(voxApplicationState.get('gestureAdaptationIntensityModes')).map(([name, value]) => {
                  return html`
                    <button
                      class="option ${data.gestureIntensityInputMax === value ? 'selected' : ''}"
                      @click="${e => voxPlayerState.set({ gestureIntensityInputMax: (value) })}"
                    >${name}</button>
                  `;
                })}
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
                ${Object.entries(voxApplicationState.get('gestureAdaptationTempoModes') ).map(([name, value]) => {
                return html`
                  <button
                    class="option ${data.audioLatencyAdaptation === value ? 'selected' : ''}"
                    @click="${e => voxPlayerState.set({ audioLatencyAdaptation: (value) })}"
                  >${name}</button>
                  `;
                })}
              </div>
            </div>

            <hr />

            <div class="adjust-param param-calibration">
              <div class="col-1">
                <button
                  @click="${e => {
                    if (guiState.showAdvancedSettings) {
                      data.voxPlayerState.set({ scenarioPlayback: false });
                    }

                    guiState.showAdvancedSettings = false;
                    guiState.showCalibrationScreen = true;
                    exp.updateGuiState(guiState);
                  }}"
                >Calibrer</button>
              </div>
            </div>

            <div class="adjust-param param-latency">
              <div class="col-2">
                <p>Latence</p>
                <input
                  type="number"
                  value="${parseInt((data.audioLatencyMeasured ? data.audioLatencyMeasured : 0) * 1e3)}"
                  @blur="${e => {
                    const value = parseFloat(e.currentTarget.value);
                    if (!Number.isNaN(value)) {
                      voxPlayerState.set({ audioLatencyMeasured: value * 1e-3 });
                    }
                  }}"
                />
              </div>
            </div>
          </div>
        `
      : nothing}

      <!-- ---------------------------------- -->
      <!-- CALIBRATION OVERLAY                -->
      <!-- ---------------------------------- -->
      ${guiState.showCalibrationScreen ?
        html`
          <div class="calibration">
            <h2>Adaptation au geste</h2>
            <p>
              Cette étape permet d'adapter l'application entre votre téléphone et votre geste.
              Elle est nécéssaire pour accéder aux modes "Tempo", "Départ" et "Tempo & Nuance".
            </p>
            <p>
              Cliquez sur « Calibrer » et après 4 bips, c’est à vous. Faites un geste simple et précis à chaque temps.
            </p>
            <p>
              Le processus peut être un peu long, continuez régulièrement jusqu'à l'arrêt.
            </p>

            ${
              data.audioLatencyMeasured === null && data.scenarioStatus === 'cancel' ?
                html`<p class="info failure">
                  La latence n'a pas pu être estimée.<br/ >Merci de recommencer.
                </p>` :
              data.audioLatencyMeasured === null && data.scenarioStatus === null ?
                html`<p class="info todo">
                  La latence entre votre geste et le son doit encore être estimée.
                </p>` :
              data.audioLatencyMeasured !== null ?
                html`<p class="info success">
                  La latence estimée entre votre geste et le son est de ${parseInt(data.audioLatencyMeasured * 1e3)} ms.
                </p>` :
                html`<p class="info">
                  &nbsp;<br />&nbsp;
                </p>`
            }

            <button
              class="${
                data.scenarioCurrent !== 'scenarioLatencyCalibration' ?
                  'color-default' : 'color-process'
              }"
              @click="${e => {
                if (data.scenarioCurrent !== 'scenarioLatencyCalibration') {
                  voxPlayerState.set({ scenarioLatencyCalibration: true });
                }
              }}"
            >
              ${data.scenarioCurrent !== 'scenarioLatencyCalibration' ?
                'Calibrer' : 'Calibration en cours...'}
            </button>

            <button
              class="back color-light-grey"
              @click="${e => {
                if (data.scenarioCurrent === 'scenarioLatencyCalibration') {
                  voxPlayerState.set({ playback: false });
                  voxPlayerState.set({ scenarioLatencyCalibration: false });
                }

                guiState.showCalibrationScreen = false;
                exp.updateGuiState(guiState);
              }}"
            >Terminer</button>
          </div>
        `
      : nothing}

      <!-- ---------------------------------- -->
      <!-- CREDITS OVERLAY                    -->
      <!-- ---------------------------------- -->
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
      <div
        class="main"
        @click="${e => {
          if (guiState.showAdvancedSettings === true) {
            guiState.showAdvancedSettings = false;
            exp.updateGuiState(guiState);
          }
        }}"
      >
      <!-- choose track and preview -->
        <div class="track">
          <div class="select">
            <select
              .value=${data.scoreFileName ? data.scoreFileName : 'none'}
              @change="${e => {
                const scoreFileName = (e.target.value === 'none' ? null : e.target.value);
                voxPlayerState.set({scoreFileName});
             }}"
            >
              ${['none', ...voxApplicationState.get('scores')].map(scoreFileName => {
                const selected = data.scoreFileName === (scoreFileName === 'none' ? null : scoreFileName);
                const label = (scoreFileName === 'none' ? 'Sélectionner une partition' : scoreFileName);

                return html`
                  <option
                    .value=${scoreFileName}
                    ?selected="${selected}"
                  >${label}</option>
                `;
              })}
            </select>
            <div class="select-arrow"></div>
          </div>
          <svg
            class="listen-track
              ${data.scenarioCurrent === 'scenarioListening' ? ' active' : ''}
              ${data.scenarioPlayback ? ' disabled' : ''}
            "
            viewbox="0 0 100 100"
            @click="${e => {
              if (data.scenarioPlayback) {
                return;
              }

              if (data.scenarioCurrent !== 'scenarioListening') {
                voxPlayerState.set({ scenarioListening: true });
              } else {
                voxPlayerState.set({ scenarioListening: false });
              }
            }}"
          >
            <polygon class="play-shape" points="20,15, 80,50, 20,85"></polygon>
            <polygon class="stop-shape" points="20,20, 80,20, 80,80, 20,80"></polygon>
          </svg>

          ${data.scoreFileName && data.scoreData
            ? html`
                <p class="track-infos">
                  ${data.timeSignature.count}/${data.timeSignature.division}
                  - tempo ${scoreTempo} à la ${scoreDivisionName}
                </p>
              `
            : html`<p class="track-infos">&nbsp;</p>`
          }
        </div>

        <div class="exercise-type">
          <button
            class="${data.scenarioCurrent === 'scenarioIntensity' ? 'selected' : ''}"
            @click="${e => {
              if (data.scenarioPlayback === true) { return; }

              if (data.scenarioCurrent !== 'scenarioIntensity' ) {
                voxPlayerState.set({ scenarioIntensity: true });
              }
            }}"
          >Nuance</button>
          <button
            class="${data.scenarioCurrent === 'scenarioTempo' ? 'selected' : ''}${data.audioLatencyMeasured === null ? ' locked' : ''}"
            @click="${e => {
              if (data.scenarioPlayback === true) { return; }

              if (data.audioLatencyMeasured === null) {
                guiState.showCalibrationScreen = true;
                exp.updateGuiState(guiState);
              } else if (data.scenarioCurrent !== 'scenarioTempo') {
                voxPlayerState.set({ scenarioTempo: true });
              }
            }}"
          >Tempo</button>
          <button
            class="${data.scenarioCurrent === 'scenarioTempoIntensity' ? 'selected' : ''}${data.audioLatencyMeasured === null ? ' locked' : ''}"
            @click="${e => {
              if (data.scenarioPlayback === true) { return; }

              if (data.audioLatencyMeasured === null) {
                guiState.showCalibrationScreen = true;
                exp.updateGuiState(guiState);
              } else if (data.scenarioCurrent !== 'scenarioTempoIntensity') {
                voxPlayerState.set({ scenarioTempoIntensity: true });
              }
            }}"
          >Tempo & Nuance</button>
          <button
            class="${data.scenarioCurrent === 'scenarioStartStopWithBeating' ? 'selected' : ''}${data.audioLatencyMeasured === null ? ' locked' : ''}"
            @click="${e => {
              if (data.scenarioPlayback === true) { return; }

              if (data.audioLatencyMeasured === null) {
                guiState.showCalibrationScreen = true;
                exp.updateGuiState(guiState);
              } else if (data.scenarioCurrent !== 'scenarioStartStopWithBeating') {
                voxPlayerState.set({ scenarioStartStopWithBeating: true });
              }
            }}"
          >Départ</button>
        </div>

        <div class="exercise-control">
          <svg
            class="button
              ${data.scenarioPlayback ? ' active' : ''}
              ${data.scenarioCurrent === null || data.scenarioCurrent === 'scenarioListening' ? ' disabled' : ''}
            "
            viewbox="0 0 100 100"
            @click="${e => {
              if (
                data.scenarioCurrent === null ||
                data.scenarioCurrent === 'scenarioListening' ||
                data.scenarioCurrent === 'scenarioCalibration'
              ) {
                return;
              }

              if (!data.scenarioPlayback) {
                voxPlayerState.set({ scenarioPlayback: true });
              } else {
                voxPlayerState.set({ scenarioPlayback: false });
              }
            }}"
          >
            <polygon class="play-shape" points="30,20, 80,50, 30,80"></polygon>
            <polygon class="stop-shape" points="25,25, 75,25, 75,75, 25,75"></polygon>
          </svg>
        </div>

        <div class="tempo-current">
          <span class="label">Tempo courant</span>
          <span class="value">${Math.round(data.tempo * data.timeSignature.division / 4)}</span>
        </div>

        <div class="tempo-reference">
          <span class="label">Tempo de référence</span>
          <input
            value="${data.scoreData ? scoreTempo : 0}"
            type="number"
            class="value"
            @blur="${e => {
              const value = parseFloat(e.currentTarget.value);
              const tempo = (value * 4 / data.timeSignature.division) || 60;
              voxPlayerState.set({ tempo });
            }}"
          />
        </div>

        <div class="metronome">
          <span class="label">Métronome</span>
          <button
            class="value ${data.metronomeSound ? 'active' : ''}"
            @click="${e => {
              if (data.metronomeSound) {
                voxPlayerState.set({ metronomeSound: false });
              } else {
                voxPlayerState.set({ metronomeSound: true });
              }
            }}"
          ></button>
        </div>
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
