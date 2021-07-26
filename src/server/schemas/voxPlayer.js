export default {

  audioLatency: {
    type: 'float',
    default: 10e-3,
    metas: {
      exported: false,
      stored: true,
    },
  },

  audioLatencyUi: {
    type: 'boolean',
    default: true,
  },

  beatGestureWaitingDurationMax: {
    type: 'float',
    default: 2, // in seconds, for time-out
  },

  beatingSound: {
    type: 'boolean',
    default: false,
  },

  beatingSoundUi: {
    type: 'boolean',
    default: false,
  },

  clockTimeUi: {
    type: 'boolean',
    default: false,
  },

  debugAudio: {
    type: 'boolean',
    default: false,
  },

  debugAudioUi: {
    type: 'boolean',
    default: false,
  },

  gestureControlsBeatOffset: {
    type: 'boolean',
    default: false,
  },

  gestureControlsBeatOffsetUi: {
    type: 'boolean',
    default: false,
  },

  gestureControlsIntensity: {
    type: 'boolean',
    default: false,
  },

  gestureControlsIntensityUi: {
    type: 'boolean',
    default: true,
  },

  gestureControlsPlaybackStart: {
    type: 'boolean',
    default: false,
  },

  gestureControlsPlaybackStartUi: {
    type: 'boolean',
    default: false,
  },

  gestureControlsPlaybackStartStatus: {
    type: 'string',
    default: null,
    nullable: true,
    metas: {
      exported: false,
    },
  },

  gestureControlsPlaybackStop: {
    type: 'boolean',
    default: false,
  },

  gestureControlsPlaybackStopUi: {
    type: 'boolean',
    default: false,
  },

  gestureControlsTempo: {
    type: 'boolean',
    default: false,
  },

  gestureControlsTempoUi: {
    type: 'boolean',
    default: true,
  },

  intensityRange: {
    type: 'float',
    default: 40, // dB
  },

  // minimum as a request, actual value may be more
  lookAheadNotesRequest: {
    type: 'float',
    default: 0.125, // 1 quarter-note
  },

  lookAheadNotesRequestUi: {
    type: 'boolean',
    default: false,
  },

  // actual value, depending on audio latency and maximum tempo
  lookAheadNotes: {
    type: 'float',
    default: 0.125, // 1 quarter-note
    metas: {
      exported: false,
    },
  },

  measures: {
    type: 'boolean',
    default: true,
    metas: {
      exported: false,
      shared: false,
    },
  },

  measuresClear: {
    type: 'boolean',
    event: true,
  },

  measuresFinalise: {
    type: 'boolean',
    event: true,
  },

  metronomeSound: {
    type: 'boolean',
    default: false,
  },

  metronomeSoundUi: {
    type: 'boolean',
    default: true,
  },

  mockSensors: {
    type: 'boolean',
    default: false,
    metas: {
      exported: false,
      stored: true,
    },
  },

  playback: {
    type: 'boolean',
    default: false,
  },

  playbackUi: {
    type: 'boolean',
    default: true,
  },

  playbackStartAfterCount: {
    type: 'any',
    default: {
      bar: 1,
      beat: 1, // one more for upbeat before start
    },
  },

  playbackStartAfterCountUi: {
    type: 'boolean',
    default: false,
  },

  playbackStopAfterCount: {
    type: 'any',
    default: {
      bar: 1,
      beat: 0,
    },
  },

  playbackStopAfterCountUi: {
    type: 'boolean',
    default: false,
  },

  playbackStopSeek: {
    type: 'string',
    default: 'start', // 'barStart', 'start', or null
    nullable: true,
  },

  playbackStopSeekUi: {
    type: 'boolean',
    default: false,
  },

  playerIdUi: {
    type: 'boolean',
    default: false,
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

  scenarioStartStopWithBeatingUi: {
    type: 'boolean',
    default: true,
  },

  scenarioLatencyCalibration: {
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

  scoreControlsTempoUi: {
    type: 'boolean',
    default: false,
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

  scoreUi: {
    type: 'boolean',
    default: true,
  },

  sessionNameUi: {
    type: 'boolean',
    default: false,
  },

  sessionSelectionUi: {
    type: 'boolean',
    default: false,
  },

  seekPosition: {
    type: 'any',
    event: true,
  },

  seekPositionBarUi: {
    type: 'boolean',
    default: true,
  },

  seekPositionBeatUi: {
    type: 'boolean',
    default: false,
  },

  seekPositionRestartUi: {
    type: 'boolean',
    default: false,
  },

  storageClear: {
    type: 'string',
    event: true,
  },

  storageClearAll: {
    type: 'boolean',
    event: true,
  },

  tempo: {
    type: 'float',
    default: 80,
  },

  tempoLimits: {
    type: 'any',
    default: {
      absoluteMin: 40,
      absoluteMax: 160,
      relativeMin: 0.76,
      relativeMax: 1.24,
    },
  },

  tempoLimitsUi: {
    type: 'boolean',
    default: false,
  },

  tempoReset: {
    type: 'any',
    event: true,
  },

  tempoUi: {
    type: 'boolean',
    default: true,
  },

  timeSignature: {
    type: 'any',
    default: {count: 4, division: 4},
  },

  timeSignatureUi: {
    type: 'boolean',
    default: true,
  },

  uiOptions: {
    type: 'boolean',
    default: false,
  },

};
