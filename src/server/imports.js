import conversion from './helpers/conversion.js';
import math from './helpers/math.js';

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
    conversion,
    math,
  },
};

