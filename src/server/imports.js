import audio from './helpers/audio/index.js';
import {Clipper} from './helpers/Clipper.js'
import conversion from './helpers/conversion.js';
import {Hysteresis} from './helpers/Hysteresis.js';
import math from './helpers/math.js';
import {Scaler} from './helpers/Scaler.js'
import time from './helpers/time.js';

let app;
if(typeof window !== 'undefined') {
  app = window.app || {};
  window.app = app;
} else if(typeof global !== 'undefined') {
  app = global.app || {};
  global.app = app;
}

app.imports = {
  helpers: {
    audio,
    Clipper,
    conversion,
    Hysteresis,
    math,
    Scaler,
    time,
  },
};

