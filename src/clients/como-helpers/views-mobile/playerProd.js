import { html, nothing } from 'lit-html';

export function playerProd(data) {
  const guiState = data.guiState;
  const exp = data.experience;

  const voxApplicationState = data.voxApplicationState;
  const voxPlayerState = data.voxPlayerState;
  const loading = data.scoreFileName && !data.scoreReady;

  return html`
    <header>
      <h1 class="title">
        <img src="./images/logo.png" alt="como vox" />
      </h1>
      <button
        class="settings-btn"
        @click="${e => {
          if (loading) {
            return;
          }

          guiState.showAdvancedSettings = !guiState.showAdvancedSettings;

          if (guiState.showAdvancedSettings) {
            data.voxPlayerState.set({ scenarioPlayback: false });
          }

          exp.updateGuiState(guiState);
        }}"
      ></button>
    </header>

    <section id="main">
      <div >

      ${loading
        ? html`<div class="loading"><p>chargement...<p></div>`
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
                ${Object.entries(voxApplicationState.get('gestureAdaptationIntensityModes') ).map( ([name, value]) => {
                return html`
              <button class="option gestureAdaptation ${data.gestureIntensityInputMax === value
                         ? 'selected' : ''}"
                      @click="${e => voxPlayerState.set({gestureIntensityInputMax: (value)})}">
              ${name}
              </button>
              `;
              }) }
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
                ${Object.entries(voxApplicationState.get('gestureAdaptationTempoModes') ).map( ([name, value]) => {
                return html`
              <button class="option gestureAdaptation ${data.audioLatencyAdaptation === value
                         ? 'selected' : ''}"
                      @click="${e => voxPlayerState.set({audioLatencyAdaptation: (value)})}">
              ${name}
              </button>
              `;
              }) }
              </div>
            </div>

            <hr />

            <div class="adjust-param param-calibration">
              <div class="col-1">
                <button
                  @click="${e => {
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
                  value="${voxPlayerState.get('audioLatencyMeasured') * 1e3}"
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
            <h2>Calibration</h2>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
quis nostrud exercitation ullamco.
            </p>
            ${voxPlayerState.get('audioLatencyMeasured') !== null
              ? html`<p>La latence estimée entre le geste et le son est de ${data.audioLatency * 1e3}ms</p>`
              : html`<p>La latence entre le geste et le son doit être estimée</p>`
            }

            <div class="adjust-param param-calibration">
              <div class="col-1">
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
                    'Commencer' : 'Calibration en cours...'}
                </button>
                <button
                  class="color-white"
                  @click="${e => {
                    if (data.scenarioCurrent !== 'scenarioLatencyCalibration') {
                      voxPlayerState.set({ playback: false });
                      voxPlayerState.set({ scenarioLatencyCalibration: false });
                    }

                    guiState.showCalibrationScreen = false;
                    exp.updateGuiState(guiState);
                  }}"
                >Terminer</button>
              </div>
            </div>
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
            ${voxPlayerState.get('scenarioPlayback') ? ' disabled' : ''}
          "
          viewbox="0 0 100 100"
          @click="${e => {
            if (voxPlayerState.get('scenarioPlayback')) {
              return;
            }

            if (data.scenarioCurrent !== 'scenarioListening') {
              data.voxPlayerState.set({ scenarioListening: true });
            } else {
              data.voxPlayerState.set({ scenarioListening: false });
            }
          }}"
        >
          <polygon class="play-shape" points="20,15, 80,50, 20,85"></polygon>
          <polygon class="stop-shape" points="20,20, 80,20, 80,80, 20,80"></polygon>
        </svg>

        ${data.scoreFileName && data.scoreData
          ? html`
              <p class="track-infos">
                ${data.timeSignature.count}/${data.timeSignature.division} -
                ${Math.round(data.scoreData.masterTrack.tempo)} à la noire
              </p>
            `
          : html`<p class="track-infos">&nbsp;</p>`
        }
      </div>

      <div class="exercise-type"
        @click="${e => {
          // @note - the buttons should be activated from the state
          const buttons = e.currentTarget.querySelectorAll('button');
          Array.from(buttons).forEach(b => b.classList.remove('selected'));
          e.target.classList.add('selected');
        }}"
      >
        <button
          class="${voxPlayerState.get('scenarioIntensity') ? 'selected' : ''}"
          @click="${e => {
            if (voxPlayerState.get('scenarioPlayback')) {
              return;
            }

            if (!voxPlayerState.get('scenarioIntensity')) {
              voxPlayerState.set({ scenarioIntensity: true });
            }
          }}"
        >Nuance</button>
        <button
          class="${voxPlayerState.get('scenarioTempo') ? 'selected' : ''}"
          @click="${e => {
            if (voxPlayerState.get('scenarioPlayback')) {
              return;
            }

            if (!voxPlayerState.get('scenarioTempo')) {
              voxPlayerState.set({ scenarioTempo: true });
            }

            if (voxPlayerState.get('audioLatencyMeasured') === null) {
              guiState.showCalibrationScreen = true;
              exp.updateGuiState(guiState);
            }
          }}"
        >Tempo</button>
        <button
          class="${voxPlayerState.get('scenarioFull') ? 'selected' : ''}"
          @click="${e => {
            if (voxPlayerState.get('scenarioPlayback')) {
              return;
            }

            if (!voxPlayerState.get('scenarioTempoIntensity')) {
              voxPlayerState.set({ scenarioFull: true });
            }

            if (voxPlayerState.get('audioLatencyMeasured') === null) {
              guiState.showCalibrationScreen = true;
              exp.updateGuiState(guiState);
            }
          }}"
        >Tempo & Nuance</button>
        <button
          class="${voxPlayerState.get('scenarioStartStopWithBeating') ? 'selected' : ''}"
          @click="${e => {
            if (voxPlayerState.get('scenarioPlayback')) {
              return;
            }

            if (!voxPlayerState.get('scenarioStartStopWithBeating')) {
              voxPlayerState.set({ scenarioStartStopWithBeating: true });
            }

            if (voxPlayerState.get('audioLatencyMeasured') === null) {
              guiState.showCalibrationScreen = true;
              exp.updateGuiState(guiState);
            }
          }}"
        >Départ</button>
      </div>

      <div class="exercise-control">
        <svg
          class="button
            ${voxPlayerState.get('scenarioPlayback') ? ' active' : ''}
            ${data.scenarioCurrent === null || data.scenarioCurrent === 'scenarioListening' ? ' disabled' : ''}
          "
          viewbox="0 0 100 100"
          @click="${e => {
            if (data.scenarioCurrent === null || data.scenarioCurrent === 'scenarioListening') {
              return;
            }

            if (!voxPlayerState.get('scenarioPlayback')) {
              data.voxPlayerState.set({ scenarioPlayback: true });
            } else {
              data.voxPlayerState.set({ scenarioPlayback: false });
            }
          }}"
        >
          <polygon class="play-shape" points="30,20, 80,50, 30,80"></polygon>
          <polygon class="stop-shape" points="25,25, 75,25, 75,75, 25,75"></polygon>
        </svg>
      </div>

      <div class="tempo-current">
        <span class="label">Tempo courant</span>
        <span class="value">${Math.round(data.tempo)}</span>
      </div>

      <div class="tempo-reference">
        <span class="label">Tempo de référence</span>
        <input
          value="${data.scoreData ? Math.round(data.scoreData.masterTrack.tempo) : 0}"
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
        <span class="label">Metronome</span>
        <button
          class="value ${voxPlayerState.get('metronomeSound') ? 'active' : ''}"
          @click="${e => {
            if (voxPlayerState.get('metronomeSound')) {
              voxPlayerState.set({ metronomeSound: false });
            } else {
              voxPlayerState.set({ metronomeSound: true });
            }
          }}"
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
