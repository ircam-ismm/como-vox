export default {

  audioDebug: {
    type: 'boolean',
    default: false,
  },

  audioLatency: {
    type: 'float',
    default: 10e-3,
  },

  beatingSound: {
    type: 'boolean',
    default: false,
  },

  gestureControlsBeatOffset: {
    type: 'boolean',
    default: false,
  },

  gestureControlsIntensity: {
    type: 'boolean',
    default: false,
  },

  gestureControlsPlaybackStart: {
    type: 'boolean',
    default: false,
  },

  gestureControlsPlaybackStop: {
    type: 'boolean',
    default: false,
  },

  gestureControlsTempo: {
    type: 'boolean',
    default: false,
  },

  lookAheadNotes: {
    type: 'float',
    default: 0.125, // 1 quarter-note
  },

  metronomeSound: {
    type: 'boolean',
    default: false,
  },

  playback: {
    type: 'boolean',
    default: false,
  },

  record: {
    type: 'boolean',
    default: false,
  },

  score: {
    type: 'any',
    default: null,
    nullable: true,
  },

  scoreControlsTempo: {
    type: 'boolean',
    default: true,
  },

  scoreControlsTimeSignature: {
    type: 'boolean',
    default: true,
  },

  scoreData: {
    type: 'any',
    default: null,
    nullable: true,
  },

  scoreFileName: {
    type: 'string',
    default: null,
    nullable: true,
  },

  scoreReady: {
    type: 'boolean',
    default: false,
  },

  seekPosition: {
    type: 'any',
    event: true,
  },

  tempo: {
    type: 'float',
    default: 80,
  },

  tempoReset: {
    type: 'any',
    event: true,
  },

  timeSignature: {
    type: 'any',
    default: {count: 4, division: 4},
  },

  uiPreset: {
    type: 'string',
    default: 'simple',
  },

};
