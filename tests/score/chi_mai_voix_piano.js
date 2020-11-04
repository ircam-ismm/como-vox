import {describe, it} from 'mocha';
import {assert, should} from 'chai';

import {assertBeatEqual} from './utils.js';

import fs from 'fs';
import path from 'path';

import {parse} from '../../src/shared/score/midi.js'

const file = 'tests/score/assets/chi_mai_voix_piano.mid';

describe(`Parse ${file}`, () => {

  const data = fs.readFileSync(file, 'binary');
  const {masterTrack, partSet} = parse(data);

  describe('Check the parts', () => {

    partSet.forEach( (part, p) => {
      it(`should verify for part ${p} "${part.name}"`, () => {

        let noteOnCount = 0;
        let noteOffCount = 0;

        let noteOnFirst;
        let noteOnLast;
        let noteOffLast;
        part.events.forEach( (event) => {
          if(event.type === 'noteOn') {
            if(noteOnCount === 0) {
              noteOnFirst = event;
            }
            noteOnLast = event;
            ++noteOnCount;
          } else if(event.type === 'noteOff') {
            ++noteOffCount;
            noteOffLast = event;
          }
        });

        switch(p) {
          case 0:
            assert.equal(noteOnFirst.bar, 4, 'first noteOn bar');
            assertBeatEqual(noteOnFirst.beat, 1, 1.05, 'first noteOn beat');

            assert.equal(noteOnLast.bar, 82, 'last noteOn bar');
            assertBeatEqual(noteOnLast.beat, 1, 1.05, 'last noteOn beat');

            assert.equal(noteOffLast.bar, 82, 'last noteOff bar');
            assertBeatEqual(noteOffLast.beat, 2.75, 3.05, 'last noteOff beat');
            break;

          case 1:
            assert.equal(noteOnFirst.bar, 4, 'first noteOn bar');
            assertBeatEqual(noteOnFirst.beat, 1, 1.05, 'first noteOn beat');

            assert.equal(noteOnLast.bar, 82, 'last noteOn bar');
            assertBeatEqual(noteOnLast.beat, 1, 1.05, 'last noteOn beat');

            assert.equal(noteOffLast.bar, 82, 'last noteOff bar');
            assertBeatEqual(noteOffLast.beat, 2.75, 3.05, 'last noteOff beat');
            break;

          case 2:
            assert.equal(noteOnFirst.bar, 4, 'first noteOn bar');
            assertBeatEqual(noteOnFirst.beat, 1, 1.05, 'first noteOn beat');

            assert.equal(noteOnLast.bar, 82, 'last noteOn bar');
            assertBeatEqual(noteOnLast.beat, 1, 1.05, 'last noteOn beat');

            assert.equal(noteOffLast.bar, 82, 'last noteOff bar');
            assertBeatEqual(noteOffLast.beat, 2.75, 3.05, 'last noteOff beat');
            break;

          case 3:
            assert.equal(noteOnFirst.bar, 4, 'first noteOn bar');
            assertBeatEqual(noteOnFirst.beat, 1, 1.05, 'first noteOn beat');

            assert.equal(noteOnLast.bar, 82, 'last noteOn bar');
            assertBeatEqual(noteOnLast.beat, 1, 1.05, 'last noteOn beat');

            assert.equal(noteOffLast.bar, 82, 'last noteOff bar');
            assertBeatEqual(noteOffLast.beat, 2.75, 3.05, 'last noteOff beat');
            break;

          case 4:
            assert.equal(noteOnFirst.bar, 1, 'first noteOn bar');
            assertBeatEqual(noteOnFirst.beat, 1, 1.05, 'first noteOn beat');

            assert.equal(noteOnLast.bar, 94, 'last noteOn bar');
            assertBeatEqual(noteOnLast.beat, 1, 1.05, 'last noteOn beat');

            assert.equal(noteOffLast.bar, 94, 'last noteOff bar');
            assertBeatEqual(noteOffLast.beat, 1.75, 2.05, 'last noteOff beat');
            break;

          case 5:
            assert.equal(noteOnFirst.bar, 1, 'first noteOn bar');
            assertBeatEqual(noteOnFirst.beat, 1, 1.05, 'first noteOn beat');

            assert.equal(noteOnLast.bar, 94, 'last noteOn bar');
            assertBeatEqual(noteOnLast.beat, 1, 1.05, 'last noteOn beat');

            assert.equal(noteOffLast.bar, 94, 'last noteOff bar');
            assertBeatEqual(noteOffLast.beat, 1.75, 2.05, 'last noteOff beat');
            break;

          default:
            assert.fail(`extra part ${p} ${part.name}`);
            break;
        }
      });

    });

  });

});

