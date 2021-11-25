export default {

  // set gestureIntensityInputMax
  gestureAdaptationIntensityModes: {
    type: 'any',
    default: {
      '-': 0.3,
      'normal': 0.5,
      '+': 0.7,
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
