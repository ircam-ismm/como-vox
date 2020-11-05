import {describe, it} from 'mocha';
import {assert, should} from 'chai';

import {assertWithin} from '../shared/utils.js';

import fs from 'fs';
import path from 'path';

import {parse} from '../../src/shared/score/midi.js'

const file = 'tests/score/assets/coule-la-seine.midi';

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
            assert.equal(part.name, 'Voix', 'part name');

            assert.equal(noteOnFirst.bar, 5, 'first noteOn bar');
            assertWithin(noteOnFirst.beat, 1, 1.05, 'first noteOn beat');

            assert.equal(noteOnLast.bar, 52, 'last noteOn bar');
            assertWithin(noteOnLast.beat, 2.75, 3.05, 'last noteOn beat');

            assert.equal(noteOffLast.bar, 52, 'last noteOff bar');
            assertWithin(noteOffLast.beat, 3.75, 4.05, 'last noteOff beat');
            break;

          case 1:
            assert.equal(part.name, 'Piano', 'part name');

            assert.equal(noteOnFirst.bar, 1, 'first noteOn bar');
            assertWithin(noteOnFirst.beat, 1, 1.05, 'first noteOn beat');

            assert.equal(noteOnLast.bar, 53, 'last noteOn bar');
            assertWithin(noteOnLast.beat, 1, 1.05, 'first noteOn beat');

            assert.equal(noteOffLast.bar, 53, 'last noteOff bar');
            assertWithin(noteOffLast.beat, 2.75, 3.05, 'last noteOff beat');
            break;

          case 2:
            assert.equal(part.name, 'Piano', 'part name');

            assert.deepEqual([noteOnFirst.bar, noteOnFirst.beat], [1, 1],
                             'first noteOn');
            assert.deepEqual([noteOnLast.bar, noteOnLast.beat], [53, 1],
                             'last noteOn');
            assert.equal(noteOffLast.bar, 53, 'last noteOff bar');
            assertWithin(noteOffLast.beat, 2.75, 3.05, 'last noteOff beat');
            break;

          default:
            assert.fail(`extra part ${p} ${part.name}`);
            break;
        }
      });

    });

  });

});

