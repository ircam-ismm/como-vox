import {describe, it} from 'mocha';
import {assert, should} from 'chai';

import fs from 'fs';
import path from 'path';

import { parse } from '../../src/shared/score/midi.js'

const files = [
  'tests/score/assets/chi_mai_voix_piano.mid',
  'tests/score/assets/coule-la-seine.midi',
  'tests/score/assets/test_voix_et_piano.mid',
];

describe('Parse complete MIDI files', () => {

  files.forEach( (file) => {

    describe(`Parse ${file}`, () => {

      const data = fs.readFileSync(file, 'binary');

      const {masterTrack, partSet} = parse(data);

      describe('Each part should contains same number of noteOn and noteOff', () => {

        partSet.forEach( (part, p) => {
          it(`should verify for part ${p} "${part.name}"`, () => {
            let noteOnCount = 0;
            let noteOffCount = 0;
            part.events.forEach( (event) => {
              if(event.type === 'noteOn') {
                ++noteOnCount;
              } else if(event.type === 'noteOff') {
                ++noteOffCount;
              }
            });

            assert.equal(noteOnCount, noteOffCount);
          });

        });

      });

    });

  });

});
