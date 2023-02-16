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

  scores: {
    type: 'any',
    default: [],
  },

  scoresPath: {
    type: 'string',
    default: 'scores',
  },

};
