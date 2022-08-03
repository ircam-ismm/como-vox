import { html, nothing } from 'lit-html';

import { tempoChangeBeatingUnit } from '../../../server/helpers/conversion.js';
import { closest } from '../../../server/helpers/math.js';
import '@ircam/simple-components/sc-dragndrop.js';

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

export function playerElectron(data) {
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
    <!-- <header>
      <h1 class="title"></h1>
    </header> -->

    <section id="electron">
      <!-- ---------------------------------- -->
      <!-- LOADING OVERLAY                    -->
      <!-- ---------------------------------- -->
      ${loading
        ? html`<div class="loading"></div>`
        : nothing
      }

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

      <div class="column-right">
        <!-- ---------------------------------- -->
        <!-- ADVANCED SETTINGS MENU             -->
        <!-- ---------------------------------- -->

        <div class="comote-settings">
          <h2>CoMo.te
            <div class="connection-status${data.comoteState.get('connected') ? ' connected' : ''}"></div>
          </h2>
          ${data.comoteState.get('connected') === false
            ? html`
              <p>Connexion</p>
              <ol>
                <li>
                  Connectez votre smartphone au WiFi: <br />
                  ${data.comoteState.get('wifiInfos').ssid}
                </li>
                <li>
                  Lancez l'application CoMo.te sur votre smartphone
                </li>
                <li>
                  Dans l'application CoMo.te, flashez le QRCode suivant:
                  <br />
                  <br />
                  <img src="${data.qrCode}" />
                </li>
              </ol>
            `
            : nothing
          }
          <p class="info">Pour une meilleure stabilité, allez dans l'onglet "Play" et appuyez longtemps sur le bouton "Lock the screen"
          </p>
        </div>

        ${data.comoteState.get('connected') === true
          ? html`
            <!-- ---------------------------------- -->
            <!-- CALIBRATION OVERLAY                -->
            <!-- ---------------------------------- -->
            <div class="calibration">
              <h2>Calibration</h2>
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
            </div>

            ${data.audioLatencyMeasured !== null ?
              html`
                <div class="settings">
                  <h2>Adaptation au geste</h2>
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
                </div>
              ` : nothing
            }
          ` : nothing
        }
      </div>

      <!-- ---------------------------------- -->
      <!-- MAIN SCREEN                        -->
      <!-- ---------------------------------- -->
      ${data.comoteState.get('connected') === false || data.audioLatencyMeasured === null ?
        html`
          <div class="connect-first-overlay">
            <p>
              ${data.comoteState.get('connected') === false ?
                  html`<br />Merci de connecter l'application CoMo.te →` :
                data.audioLatencyMeasured === null ?
                  html`<br />Merci de procéder à la calibration →`
                : ''}
            </p>
            <p></p>
          </div>
        `
      : nothing}

      <div class="main">
        <!-- choose track and preview -->
        <div>
          <h2>Choisir un morceau existant</h2>
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
        </div>
        <div class="track-drop">
          <h2>Ou importer un fichier</h2>
          <sc-dragndrop
            label="Glissez votre fichier midi ici"
            width="400"
            height="100"
            @change=${e => {
              const first = Object.keys(e.detail.value)[0];
              if (first) {
                const file = e.detail.value[first];
                console.log(file);
                voxPlayerState.set({ scoreFileName: file });
              }
            }}
          >
          </sc-dragndrop>
        </div>

        <div class="track">
          <h2>Écouter le morceau</h2>
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
        </div>

        <div class="exercise-type">
          <h2>
            Sélectionner un exercice et jouer !
          </h2>
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
            class="${data.scenarioCurrent === 'scenarioTempo' ? 'selected' : ''}${data.audioLatencyMeasured === null ? ' locked' : ''}${data.audioLatencyMeasured === null && guiState.showTip === 'locked-exercise' ? ' highlight' : ''}"
            @click="${e => {
              if (data.scenarioPlayback === true) { return; }

              if (data.audioLatencyMeasured === null) {
                guiState.showCalibrationScreen = true;
                guiState.showTip = null;
                exp.updateGuiState(guiState);
              } else if (data.scenarioCurrent !== 'scenarioTempo') {
                voxPlayerState.set({ scenarioTempo: true });
              }
            }}"
          >Tempo</button>
          <button
            class="${data.scenarioCurrent === 'scenarioTempoIntensity' ? 'selected' : ''}${data.audioLatencyMeasured === null ? ' locked' : ''}${data.audioLatencyMeasured === null && guiState.showTip === 'locked-exercise' ? ' highlight' : ''}"
            @click="${e => {
              if (data.scenarioPlayback === true) { return; }

              if (data.audioLatencyMeasured === null) {
                guiState.showCalibrationScreen = true;
                guiState.showTip = null;
                exp.updateGuiState(guiState);
              } else if (data.scenarioCurrent !== 'scenarioTempoIntensity') {
                voxPlayerState.set({ scenarioTempoIntensity: true });
              }
            }}"
          >Tempo & Nuance</button>
          <button
            class="${data.scenarioCurrent === 'scenarioStartStopWithBeating' ? 'selected' : ''}${data.audioLatencyMeasured === null ? ' locked' : ''}${data.audioLatencyMeasured === null && guiState.showTip === 'locked-exercise' ? ' highlight' : ''}"
            @click="${e => {
              if (data.scenarioPlayback === true) { return; }

              if (data.audioLatencyMeasured === null) {
                guiState.showCalibrationScreen = true;
                guiState.showTip = null;
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

        <div>
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
