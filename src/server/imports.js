import {metronome} from './scripts/metronome.js'
import {clickGenerator} from './scripts/clickGenerator.js';
import conversion from './helpers/conversion.js';

let app;
if(typeof window !== 'undefined') {
  app = window.app || {};
  window.app = app;
} else if(typeof process !== 'undefined') {
  app = process.app || {};
  process.app = app;
}

app.imports = {
  scripts: {
    metronome,
    clickGenerator,
  },
  helpers: {
    conversion,
  },
};

