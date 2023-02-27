export default {

  audioIntensityRange: {
    type: 'float',
    default: 40, // dB
  },

  audioIntensityRangeUi: {
    type: 'boolean',
    default: false,
  },

  audioLatency: {
    type: 'float',
    default: 0,
    metas: {
      exported: false,
      stored: false,
    },
  },

  audioLatencyMeasured: {
    type: 'float',
    default: null,
    nullable: true,
    metas: {
      exported: false,
      stored: true,
    },
  },

  audioLatencyMeasuredUi: {
    type: 'boolean',
    default: true,
  },

  audioLatencyAdaptation: {
    type: 'float',
    default: 0,
    metas: {
      exported: false,
      stored: true,
    },
  },

  beatGestureWaitingDurationMax: {
    type: 'float',
    default: 2, // in seconds, for time-out
  },

  // around beat: half of this value before, half after
  beatOffsetRange: {
    type: 'float',
    default: 1, // in beats
  },

  beatOffsetRangeUi: {
    type: 'boolean',
    default: false,
  },

  beatingSound: {
    type: 'boolean',
    default: false,
  },

  beatingSoundUi: {
    type: 'boolean',
    default: false,
  },

  beatingUnit: {
    type: 'float',
    // 1 eighth note: 1/8
    // 1 dotted quarter is 3 eighth notes: 3/8
    default: 1/4,
  },

  beatingUnitUi: {
    type: 'boolean',
    default: false,
  },

  beatingUnitMode: {
    type: 'string',
    default: 'auto', // 'auto', 'timeSignature' or 'fixed'
  },

  beatingUnitModeUi: {
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

  editorGUI: {
    type: 'boolean',
    default: false,
    metas: {
      exported: false,
    },
  },

  gestureAdaptationBeatingMode: {
    type: 'string',
    default: 'normal',
    metas: {
      exported: false,
      stored: true,
    },
  },

  gestureAdaptationBeatingModeUi: {
    type: 'boolean',
    default: true,
  },

  gestureAdaptationIntensityMode: {
    type: 'string',
    default: 'normal',
    metas: {
      exported: false,
      stored: true,
    },
  },

  gestureAdaptationIntensityModeUi: {
    type: 'boolean',
    default: true,
  },

  gestureAdaptationTempoMode: {
    type: 'string',
    default: 'normal',
    metas: {
      exported: false,
      stored: true,
    },
  },

  gestureAdaptationTempoModeUi: {
    type: 'boolean',
    default: true,
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

  gestureIntensityInputMax: {
    type: 'float',
    default: 0.5, // 0.3 for less energy
  },

  gestureIntensityInputMaxUi: {
    type: 'boolean',
    default: false,
  },

  // relative to gestureIntensityInputMax
  gestureIntensityInputMediumRelative: {
    type: 'float',
    default: 0.5, // compression starts in the middle range
  },

  gestureIntensityInputMediumRelativeUi: {
    type: 'boolean',
    default: false,
  },

  gestureIntensityNormalisedMedium: {
    type: 'float',
    default: 0.75, // gentle compression
  },

  gestureIntensityNormalisedMediumUi: {
    type: 'boolean',
    default: false,
  },

  // minimum as a request, actual value may be more
  lookAheadNotesRequest: {
    type: 'float',
    default: 1/16, // 1 sixteenth-note
  },

  lookAheadNotesRequestUi: {
    type: 'boolean',
    default: false,
  },

  // actual value, depending on audio latency and maximum tempo
  lookAheadNotes: {
    type: 'float',
    default: 1/16, // 1 sixteenth-note
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
    default: true,
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
    },
  },

  // depends on score and scoreCompression
  noteIntensityMax: {
    type: 'float',
    default: 127, // MIDI intensity
    metas: {
      exported: false,
    },
  },

  // depends on score and scoreCompression
  noteIntensityMin: {
    type: 'float',
    default: 0, // MIDI intensity
    metas: {
      exported: false,
    },
  },

  // used by beatTriggerFromGesturePeakAdapt
  peakThresholdUi: {
    type: 'boolean',
    default: false, // beat energy
  },

  peakThresholdSafe: {
    type: 'float',
    default: 100, // beat energy
  },

  peakThresholdSensitive: {
    type: 'float',
    default: 30, // beat energy
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
      beat: 0,
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

  samplePlayerFilterNoteIntensityMin: {
    type: 'float',
    default: 0, // MIDI intensity 0
  },

  samplePlayerFilterNoteIntensityMax: {
    type: 'float',
    default: 127, // MIDI intensity
  },

  samplePlayerFilterNoteIntensityUi: {
    type: 'boolean',
    default: false,
  },

  samplePlayerFilterRelativePitchMin: {
    type: 'float',
    default: 12, // MIDI pitch, relative to note (12 is one octave),was 12
  },

  samplePlayerFilterRelativePitchMax: {
    type: 'float',
    default: 64, // MIDI pitch, relative to note, was 84
  },

  samplePlayerFilterRelativePitchUi: {
    type: 'boolean',
    default: false,
  },

  samplePlayerFilterFrequencyMin: {
    type: 'float',
    default: 500, // in Hz, was 1000
  },

  samplePlayerFilterFrequencyMax: {
    type: 'float',
    default: 22050, // in Hz
  },

  samplePlayerFilterFrequencyUi: {
    type: 'boolean',
    default: false,
  },

  scenarioCurrent: {
    type: 'string',
    default: null,
    nullable: true,
  },

  scenarioFull: {
    type: 'boolean',
    event: true,
  },

  scenarioFullUi: {
    type: 'boolean',
    default: true,
  },

  scenarioIntensity: {
    type: 'boolean',
    event: true,
  },

  scenarioIntensityUi: {
    type: 'boolean',
    default: true,
  },

  scenarioListening: {
    type: 'boolean',
    event: true,
  },

  scenarioListeningUi: {
    type: 'boolean',
    default: true,
  },

  scenarioPlayback: {
    type: 'boolean',
    default: false,
  },

  scenarioPlaybackUi: {
    type: 'boolean',
    default: true,
  },

  scenarioTempo: {
    type: 'boolean',
    event: true,
  },

  scenarioTempoUi: {
    type: 'boolean',
    default: true,
  },

  scenarioTempoIntensity: {
    type: 'boolean',
    event: true,
  },

  scenarioTempoIntensityUi: {
    type: 'boolean',
    default: true,
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
      shared: false,
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
    immediate: true,
  },

  scoreFileName: {
    type: 'string',
    default: null,
    nullable: true,
  },

  scoreFileCloseUi: {
    type: 'boolean',
    default: false,
  },

  scoreFileOpenUi: {
    type: 'boolean',
    default: false,
  },

  scoreFilesUi: {
    type: 'boolean',
    default: true,
  },

  scoreMetadata: {
    type: 'any',
    default: null,
    nullable: true,

  },

  scoreIntensityCompressionMax: {
    type: 'float',
    default: 100, // keep some headroom
  },

  scoreIntensityCompressionMinFixed: {
    type: 'float',
    default: 45, // keep some dynamics 30
  },

  scoreIntensityCompressionMinGesture: {
    type: 'float',
    default: 60, // flatter than fixed
  },

  scoreIntensityCompressionMinMaxUi : {
    type: 'boolean',
    default: false,
  },

  scoreIntensityCompressionMode: {
    type: 'string',
    // 'auto' uses 'gesture' when 'gestureControlsIntensity' is true, or 'fixed'
    // 'gesture' uses compression only when 'gestureControlsIntensity' is true
    // 'fixed' always uses compression
    default: 'auto', // 'off', 'fixed', 'gesture'
  },

  scoreIntensityCompressionModeUi: {
    type: 'boolean',
    default: false,
  },

  scoreIntensityInputRangeDisplayUi: {
    type: 'boolean',
    default: false,
  },

  scoreReady: {
    type: 'boolean',
    default: false,
    immediate: true,
    metas: {
      exported: false,
    },
  },

  scoreUrlOpenUi: {
    type: 'boolean',
    default: false,
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
    immediate: true,
  },

  tempoLimits: {
    type: 'any',
    default: {
      absoluteMin: 40,   // 40
      absoluteMax: 150,  // 160
      relativeMin: 0.76, // 0.76
      relativeMax: 1.24, //1.24
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

  tempoResetUi: {
    type: 'boolean',
    default: true,
  },

  tempoUi: {
    type: 'boolean',
    default: true,
  },

  timeSignature: {
    type: 'any',
    default: {count: 4, division: 4},
    immediate: true,
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
