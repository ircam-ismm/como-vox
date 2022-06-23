import { html, svg, nothing } from 'lit-html';

import {tempoChangeBeatingUnit} from '../../../server/helpers/conversion.js';
import {closest} from '../../../server/helpers/math.js';

import createTempoStatsPlot from '../templates/createTempoStatsPlot.js';

const beatingUnitsAndNames = [
  [1, 'ronde'],
  [3/4, 'blanche pointée'],
  [1/2, 'blanche'],
  [3/8, 'noire pointée'],
  [1/4, 'noire'],
  [3/16, 'croche pointée'],
  [1/8, 'croche'],
  [1/16, 'double-croche'],
];

const beatingUnits = beatingUnitsAndNames.map( (e) => e[0]);

export function playerProd(data) {
  const guiState = data.guiState;
  const exp = data.experience;

  const voxApplicationState = data.voxApplicationState;
  const voxPlayerState = data.voxPlayerState;
  const loading = data.scoreFileName && !data.scoreReady;

  const scoreTempo
        = (data.scoreData
           ? Math.round(tempoChangeBeatingUnit(data.scoreData.masterTrack.tempo, {
             timeSignature: data.timeSignature,
             beatingUnit: 1/4, // tempo for quarter-note
             beatingUnitNew: data.beatingUnit
           }))
           : 0);

  const tempoReference
        = Math.round(tempoChangeBeatingUnit(data.tempoReference, {
             timeSignature: data.timeSignature,
             beatingUnit: 1/4, // tempo for quarter-note
             beatingUnitNew: data.beatingUnit
        }));

  const beatingUnitValue = closest(beatingUnits, data.beatingUnit);
  const beatingUnitName = beatingUnitsAndNames.find(e => e[0] === beatingUnitValue)[1];

  return html`
    <header>
      <h1 class="title"></h1>
      <button
        class="settings-btn${guiState.showAdvancedSettings || guiState.showCalibrationScreen ? ' active' : ''}"
        @click="${e => {
          if (loading) {
            return;
          }

          if (guiState.showCalibrationScreen) {
            guiState.showCalibrationScreen = false;
          } else {
            guiState.showAdvancedSettings = !guiState.showAdvancedSettings;
          }
          guiState.showTip = null;

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
                  .value="${data.audioLatencyMeasured ? data.audioLatencyMeasured.toFixed(3) : 0}"
                  @blur="${e => {
                    const value = parseFloat(e.currentTarget.value);
                    if (!Number.isNaN(value)) {
                      voxPlayerState.set({ audioLatencyMeasured: value });
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
              Elle est nécéssaire pour accéder aux modes <i>Tempo</i>, <i>Départ</i> et <i>Tempo & Nuance</i>.
            </p>
            <p>
              Cliquez sur le bouton <i>Calibrer</i> et après 4 bips, faites un geste simple et précis à chaque temps.
            </p>
            <p>
              Le processus peut être un peu long, continuez régulièrement jusqu'à l'arrêt.
            </p>
            <p>
              Notez que la valeur estimée est dépendante du téléphone utilisé et peut-être comprise entre environ 0.02 et 0.3s, il n'y a donc pas de "bonne valeur".
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
                  La latence estimée entre votre geste et le son est de ${data.audioLatencyMeasured.toFixed(3)} s.
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
                guiState.showTip = null;
                exp.updateGuiState(guiState);
              }}"
            >Retour</button>
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
                guiState.showTip = null;
                exp.updateGuiState(guiState);
              }}"
            ></button>
            <p>
              <b>CoMo Vox</b> est développée par l'Ircam et l'unité mixte de recherche Sciences et technologies de la musique et du son (STMS), soutenue par l'Ircam, le CNRS, le ministère de la Culture et Sorbonne Université.
            </p>
            <p>
              Réalisée avec le soutien du ministère de l'Éducation Nationale, de la Jeunesse et des Sports (dispositif Édu-up), de l'Agence Nationale de la Recherche (projet ELEMENT), et en partenariat avec Radio France.
            </p>
            <div class="logos">
              <div class="row">
                <div id="ircam"></div>
                <div id="cnrs"></div>
                <div id="sorbonne"></div>
                <div id="min-culture"></div>
                <div id="anr"></div>
              </div>

              <div class="row">
                <div id="min-education"></div>
                <div id="edu-up"></div>
                <div></div>
                <div id="radio-france"></div>
                <div id="vox"></div>
              </div>
            </div>
          </div>
        `
      : nothing}

      ${guiState.showTempoStats ?
        html`
          <div class="stats">
            <button
              class="close"
              @click="${e => {
                guiState.showTempoStats = false;
                exp.updateGuiState(guiState);
              }}"
            ></button>

            ${createTempoStatsPlot(data.tempoStack, data.tempoStats, tempoReference)}

            <ul>
              <li>Tempo de référence: ${tempoReference}</li>
              <li>Tempo moyen: ${Math.round(data.tempoStats.mean)}</li>
              <li>Tempo maximum: ${Math.round(data.tempoStats.max)}</li>
              <li>Tempo minimum: ${Math.round(data.tempoStats.min)}</li>
            </ul>

            <button
              class="color-default"
              @click="${e => {
                guiState.showTempoStats = false;
                exp.updateGuiState(guiState);
              }}"
            >Continuer</button>
          </div>
        ` : nothing
      }

      <!-- ---------------------------------- -->
      <!-- MAIN SCREEN                        -->
      <!-- ---------------------------------- -->
      <div
        class="main"
        @click="${e => {
          if (guiState.showAdvancedSettings === true) {
            guiState.showTip = null;
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
                  - tempo ${scoreTempo} à la ${beatingUnitName}
                </p>
              `
            : html`<p class="track-infos">&nbsp;</p>`
          }
        </div>

        <div class="exercise-type">
          <p>
            Sélectionner un exercice
          </p>
          ${data.audioLatencyMeasured === null ?
            html`
              <div class="tip"
                @click="${e => {
                  if (guiState.showTip === 'locked-exercise') {
                    guiState.showTip = null;
                  } else {
                    guiState.showTip = 'locked-exercise';
                  }

                  exp.updateGuiState(guiState);
                }}"
              >
                <div class="icon"></div>
                ${guiState.showTip === 'locked-exercise' ?
                  html`
                    <div class="details-locked-exercise">
                      Les modes <i>Tempo</i>, <i>Départ</i> et <i>Tempo & Nuance</i>
                      requièrent une étape spéciale pour adapter votre téléphone à
                      votre geste. Pour débloquer ces modes cliquez sur un des boutons
                      et suivez les instructions !
                    </div>
                  ` : nothing
                }
              </div>
            ` : nothing
          }
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
            class="
              ${data.scenarioCurrent === 'scenarioTempo' ? 'selected' : ''}
              ${data.audioLatencyMeasured === null ? ' locked' : ''}
              ${data.audioLatencyMeasured === null && guiState.showTip === 'locked-exercise' ? ' highlight' : ''}"
            @click="${e => {
              if (data.scenarioPlayback === true) { return; }

              if (data.scenarioCurrent !== 'scenarioTempo') {
                voxPlayerState.set({ scenarioTempo: true });
              }

              if (data.audioLatencyMeasured === null) {
                guiState.showCalibrationScreen = true;
                guiState.showTip = null;
                exp.updateGuiState(guiState);
              }
            }}"
          >Tempo</button>
          <button
            class="
              ${data.scenarioCurrent === 'scenarioTempoIntensity' ? 'selected' : ''}
              ${data.audioLatencyMeasured === null ? ' locked' : ''}
              ${data.audioLatencyMeasured === null && guiState.showTip === 'locked-exercise' ? ' highlight' : ''}
            "
            @click="${e => {
              if (data.scenarioPlayback === true) { return; }

              if (data.scenarioCurrent !== 'scenarioTempoIntensity') {
                voxPlayerState.set({ scenarioTempoIntensity: true });
              }

              if (data.audioLatencyMeasured === null) {
                guiState.showCalibrationScreen = true;
                guiState.showTip = null;
                exp.updateGuiState(guiState);
              }
            }}"
          >Tempo & Nuance</button>
          <button
            class="
              ${data.scenarioCurrent === 'scenarioStartStopWithBeating' ? 'selected' : ''}
              ${data.audioLatencyMeasured === null ? ' locked' : ''}
              ${data.audioLatencyMeasured === null && guiState.showTip === 'locked-exercise' ? ' highlight' : ''}
            "
            @click="${e => {
              if (data.scenarioPlayback === true) { return; }

              if (data.scenarioCurrent !== 'scenarioStartStopWithBeating') {
                voxPlayerState.set({ scenarioStartStopWithBeating: true });
              }

              if (data.audioLatencyMeasured === null) {
                guiState.showCalibrationScreen = true;
                guiState.showTip = null;
                exp.updateGuiState(guiState);
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
          <span class="value">${
              Math.round(tempoChangeBeatingUnit(data.tempo, {
                timeSignature: data.timeSignature,
                beatingUnit: 1/4, // tempo for quarter-note
                beatingUnitNew: data.beatingUnit
              }))
          }</span>
        </div>

        <div class="tempo-reference">
          <span class="label">Tempo de référence</span>
          <input
            .value="${tempoReference}"
            type="number"
            class="value"
            @blur="${e => {
              const value = parseFloat(e.currentTarget.value);
              const tempo = (value
                             ? tempoChangeBeatingUnit(value, {
                                 timeSignature: data.timeSignature,
                                 beatingUnit: data.beatingUnit,
                                 beatingUnitNew: 1/4, // tempo for quarter-note
                               })
                             : data.tempoReference);
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

        <div class="calibration-button">
          <span class="label">&nbsp;</span>
          <button
            class="value"
            @click="${e => {
              if (guiState.showAdvancedSettings) {
                data.voxPlayerState.set({ scenarioPlayback: false });
              }

              guiState.showAdvancedSettings = false;
              guiState.showCalibrationScreen = true;
              guiState.showTip = null;
              exp.updateGuiState(guiState);
            }}"
          >Calibration</button>
        </div>



      </div>
    </section>
    <footer
      @click="${e => {
        guiState.showCreditsScreen = !guiState.showCreditsScreen;
        guiState.showTip = null;
        exp.updateGuiState(guiState);
      }}"
    >
      <p>Crédits</p>
    </footer>
`;
}
