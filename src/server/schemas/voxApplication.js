export default {

  // set gestureIntensityInputMax
  gestureAdaptationIntensityModes: {
    type: 'any',
    default: {
      '-': 0.7, // more dynamics
      'normal': 0.5,
      '+': 0.3, // for low-intensity gestures
    },
  },

  // add to audioLatency
  gestureAdaptationTempoModes: {
    type: 'any',
    default: {
      '-': -50e-3, // advance
      'normal': 0,
      '+': 50e-3, // delay
    },
  },

  gestureAdaptationBeatingModes: {
    type: 'any',
    default: {
      'normal': {
        peakThresholdSensitive: 30,
        beatOffsetRange: 1,
        tempoLimits: {
          absoluteMin: 40,
          absoluteMax: 150,
          relativeMin: 0.76,
          relativeMax: 1.24,
        },
      },

      '+': {
        peakThresholdSensitive: 30,
        beatOffsetRange: 1,
        tempoLimits: {
          absoluteMin: 40,
          absoluteMax: 150,
          relativeMin: 0.51,
          relativeMax: 1.49,
        },

      },

      '++': {
        peakThresholdSensitive: 30,
        beatOffsetRange: 2,
        tempoLimits: {
          absoluteMin: 40,
          absoluteMax: 150,
          relativeMin: 0.51,
          relativeMax: 1.49,
        },

      },

    },
  },

  scores: {
    type: 'any',
    default: [],
  },

  scoresPath: {
    type: 'string',
    default: 'scores',
  },

};
