export default {

  audioLatency: {
    type: 'float',
    default: 10e-3,
    metas: {
      exported: false,
      localstorage: true,
    },
  },

  beatGestureWaitingDurationMax: {
    type: 'float',
    default: 2, // in seconds, for time-out
  },

  beatingSound: {
    type: 'boolean',
    default: false,
  },

  debugAudio: {
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

  handedness: {
    type: 'string',
    default: null,
    nullable: true,
    metas: {
      exported: false,
      localStorage: true,
    },
  },

  handednessValidation: {
    type: 'boolean',
    event: true,
  },

  lookAheadNotes: {
    type: 'float',
    default: 0.125, // 1 quarter-note
  },

  metronomeSound: {
    type: 'boolean',
    default: false,
  },

  mockSensors: {
    type: 'boolean',
    default: false,
  },

  playback: {
    type: 'boolean',
    default: false,
  },

  playbackStartAfterCount: {
    type: 'any',
    default: {
      bar: 1,
      beat: 1, // one more for upbeat before start
    },
  },

  playbackStopAfterCount: {
    type: 'any',
    default: {
      bar: 1,
      beat: 0,
    },
  },

  record: {
    type: 'boolean',
    default: false,
    metas: {
      exported: false,
    },
  },

  scenarioCurrent: {
    type: 'string',
    default: null,
    nullable: true,
  },

  scenarioStartStopWithBeating: {
    type: 'boolean',
    event: true,
  },

  scenarioStatus: {
    type: 'string',
    nullable: true,
    default: null,
    metas: {
      exported: false,
    },
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
    metas: {
      exported: false,
      shared: false, // might be big
    },
  },

  scoreFileName: {
    type: 'string',
    default: null,
    nullable: true,
  },

  scoreReady: {
    type: 'boolean',
    default: false,
    metas: {
      exported: false,
    },
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
