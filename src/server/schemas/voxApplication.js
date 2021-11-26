export default {

  // set gestureIntensityInputMax
  gestureAdaptationIntensityModes: {
    type: 'any',
    default: {
      '-': 0.6,
      'normal': 0.4,
      '+': 0.3,
    },
  },

  // add to audioLatency
  gestureAdaptationTempoModes: {
    type: 'any',
    default: {
      '-': -50e-3,
      'normal': 0,
      '+': 50e-3,
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
