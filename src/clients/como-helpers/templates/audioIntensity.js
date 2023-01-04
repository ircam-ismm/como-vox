import { html } from 'lit-html';

import {displayToggle} from './displayToggle.js';
import {
  elementClasses,
  extraClasses,
  groupClasses,
  selfSelect,
} from './helpers.js';

const e = {};

export function audioIntensity(data) {

  const samplePlayerFilterUi = data.samplePlayerFilterNoteIntensityUi
        || data.samplePlayerFilterRelativePitchUi
        || data.samplePlayerFilterFrequencyUi;

  const groupUi = data.audioIntensityRangeUi
        || samplePlayerFilterUi;

  const voxPlayerState = data.voxPlayerState;

  return (data.uiConfiguration || groupUi ? html`
      <div class="${groupClasses(data, 'audioIntensityRange', groupUi)}">
        <span class="title text ${extraClasses(groupUi)}">Dynamique de l'audio</span>

        <span class="separator"></span>
        ${data.uiConfiguration || data.audioIntensityRangeUi ? html`
        <span class="${elementClasses(data, 'audioIntensityRange')}">
          <span class="text">Variation Maximale</span>
          <span class="valueUnit">
            <input type="number"
                   min="0"
                   max="80"
                   step="10"
                   .value=${data.audioIntensityRange}
                   @click="${e => selfSelect(e)}"
                   @change="${e => {
                               voxPlayerState.set({
                                 audioIntensityRange: parseFloat(e.srcElement.value),
                               });
                             } }"
            ><span class="text">dB</span>
          </span>

          ${data.uiConfiguration ? displayToggle(data, 'audioIntensityRangeUi') : ''}
        </span>
        ` : ''}

        <span class="separator"></span>

        ${data.uiConfiguration || samplePlayerFilterUi ? html`
          <span class="title text ${extraClasses(samplePlayerFilterUi)}">Filtre</span>
        ` : ''}

        ${data.uiConfiguration || data.samplePlayerFilterNoteIntensityUi ? html`
        <span class="${elementClasses(data, 'samplePlayerFilterNoteIntensity')}">
          <span class="text">depuis intensité</span>
          <span class="valueUnit">
            <input class="intensityLimit relative"
                   type="number"
                   min="0"
                   max="127"
                   step="10"
                   .value=${data.samplePlayerFilterNoteIntensityMin}
                   @click="${e => selfSelect(e)}"
                   @change="${e => {
                               voxPlayerState.set({
                                 samplePlayerFilterNoteIntensityMin: parseFloat(e.srcElement.value),
                               });
                             } }"
            >
          </span>

          <span class="text">à</span>
          <span class="valueUnit">
            <input class="intensityLimit relative"
                   type="number"
                   min="0"
                   max="127"
                   step="10"
                   .value=${data.samplePlayerFilterNoteIntensityMax}
                   @click="${e => selfSelect(e)}"
                   @change="${e => {
                               voxPlayerState.set({
                                 samplePlayerFilterNoteIntensityMax: parseFloat(e.srcElement.value),
                               });
                             } }"
            ><span class="text">MIDI</span>

          ${data.uiConfiguration ? displayToggle(data, 'samplePlayerFilterNoteIntensityUi') : ''}
        </span>
        ` : ''}

        ${data.uiConfiguration || data.samplePlayerFilterRelativePitchUi ? html`
        <span class="${elementClasses(data, 'samplePlayerFilterRelativePitch')}">
          <span class="text">vers hauteur relative</span>
          <span class="valueUnit">
            <input class="pitchLimit relative"
                   type="number"
                   min="-127"
                   max="127"
                   step="10"
                   .value=${data.samplePlayerFilterRelativePitchMin}
                   @click="${e => selfSelect(e)}"
                   @change="${e => {
                               voxPlayerState.set({
                                 samplePlayerFilterRelativePitchMin: parseFloat(e.srcElement.value),
                               });
                             } }"
            >
          </span>

          <span class="text">à</span>
          <span class="valueUnit">
            <input class="pitchLimit relative"
                   type="number"
                   min="-127"
                   max="127"
                   step="10"
                   .value=${data.samplePlayerFilterRelativePitchMax}
                   @click="${e => selfSelect(e)}"
                   @change="${e => {
                               voxPlayerState.set({
                                 samplePlayerFilterRelativePitchMax: parseFloat(e.srcElement.value),
                               });
                             } }"
            ><span class="text">MIDI</span>

          ${data.uiConfiguration ? displayToggle(data, 'samplePlayerFilterRelativePitchUi') : ''}
        </span>
        ` : ''}

        ${data.uiConfiguration || data.samplePlayerFilterFrequencyUi ? html`
        <span class="${elementClasses(data, 'samplePlayerFilterFrequency')}">
          <span class="text">limité de</span>
          <span class="valueUnit">
            <input class="frequencyLimit relative"
                   type="number"
                   min="0"
                   max="22050"
                   step="100"
                   .value=${data.samplePlayerFilterFrequencyMin}
                   @click="${e => selfSelect(e)}"
                   @change="${e => {
                               voxPlayerState.set({
                                 samplePlayerFilterFrequencyMin: parseFloat(e.srcElement.value),
                               });
                             } }"
            >
          </span>

          <span class="text">à</span>
          <span class="valueUnit">
            <input class="frequencyLimit relative"
                   type="number"
                   min="0"
                   max="22050"
                   step="100"
                   .value=${data.samplePlayerFilterFrequencyMax}
                   @click="${e => selfSelect(e)}"
                   @change="${e => {
                               voxPlayerState.set({
                                 samplePlayerFilterFrequencyMax: parseFloat(e.srcElement.value),
                               });
                             } }"
            ><span class="text">Hz</span>

          ${data.uiConfiguration ? displayToggle(data, 'samplePlayerFilterFrequencyUi') : ''}
        </span>
        ` : ''}



      </div>
      ` : '');
}
Object.assign(e, {audioIntensity});

export default e;
