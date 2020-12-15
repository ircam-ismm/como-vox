import conversion from './helpers/conversion.js';
import math from './helpers/math.js';

let app;
if(typeof window !== 'undefined') {
  app = window.app || {};
  window.app = app;
} else if(typeof process !== 'undefined') {
  app = process.app || {};
  process.app = app;
}

app.imports = {
  helpers: {
    conversion,
    math,
  },
};

