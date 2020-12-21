import {describe, it} from 'mocha';
import {assert, should} from 'chai';

import {assertWithin} from '../shared/utils.js';

import fs from 'fs';
import path from 'path';

import {parse} from '../../src/shared/score/midi.js'

const file = 'tests/score/assets/test_voix_et_piano.mid';

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
            assert.equal(part.name, 'Piano', 'part name');

            assert.equal(noteOnCount, 9, 'noteOn count');

            assert.deepEqual([noteOnFirst.bar, noteOnFirst.beat], [1, 1],
                             'first noteOn');
            assert.deepEqual([noteOnLast.bar, noteOnLast.beat], [9, 1],
                             'last noteOn');
            assert.equal(noteOffLast.bar, 9, 'last noteOff bar');
            assertWithin(noteOffLast.beat, 4.75, 5, 'last noteOff beat');
            break;

          case 1:
            assert.equal(part.name, 'Piano', 'part name');

            assert.equal(noteOnCount, 9, 'noteOn count');

            assert.deepEqual([noteOnFirst.bar, noteOnFirst.beat], [1, 1],
                             'first noteOn');
            assert.deepEqual([noteOnLast.bar, noteOnLast.beat], [9, 1],
                             'last noteOn');
            assert.equal(noteOffLast.bar, 9, 'last noteOff bar');
            assertWithin(noteOffLast.beat, 2.75, 3, 'last noteOff beat');
            break;

          case 2:
            assert.equal(part.name, 'Soprano', 'part name');

            assert.equal(noteOnCount, 18, 'noteOn count');

            assert.deepEqual([noteOnFirst.bar, noteOnFirst.beat], [1, 1],
                             'first noteOn');
            assert.deepEqual([noteOnLast.bar, noteOnLast.beat], [9, 3],
                             'last noteOn');
            assert.equal(noteOffLast.bar, 9, 'last noteOff bar');
            assertWithin(noteOffLast.beat, 3.75, 4, 'last noteOff beat');
            break;

          case 3:
            assert.equal(part.name, 'Alto', 'part name');

            assert.equal(noteOnCount, 18, 'noteOn count');

            assert.deepEqual([noteOnFirst.bar, noteOnFirst.beat], [1, 2],
                             'first noteOn');
            assert.deepEqual([noteOnLast.bar, noteOnLast.beat], [9, 4],
                             'last noteOn');
            assert.equal(noteOffLast.bar, 9, 'last noteOff bar');
            assertWithin(noteOffLast.beat, 4.75, 5, 'last noteOff beat');
            break;

          case 4:
            assert.equal(part.name, 'Ténor', 'part name');

            assert.equal(noteOnCount, 36, 'noteOn count');

            assert.deepEqual([noteOnFirst.bar, noteOnFirst.beat], [1, 1],
                             'first noteOn');
            assert.deepEqual([noteOnLast.bar, noteOnLast.beat], [9, 4],
                             'last noteOn');
            assert.equal(noteOffLast.bar, 9, 'last noteOff bar');
            assertWithin(noteOffLast.beat, 4.75, 5, 'last noteOff beat');
            break;

          case 5:
            assert.equal(part.name, 'Baryton', 'part name');

            assert.equal(noteOnCount, 9, 'noteOn count');

            assert.deepEqual([noteOnFirst.bar, noteOnFirst.beat], [1, 1],
                             'first noteOn');
            assert.deepEqual([noteOnLast.bar, noteOnLast.beat], [9, 1],
                             'last noteOn');
            assert.equal(noteOffLast.bar, 9, 'last noteOff bar');
            assertWithin(noteOffLast.beat, 3.75, 4, 'last noteOff beat');
            break;

          default:
            assert.fail(`extra part ${p} ${part.name}`);
            break;
        }
      });

    });

  });

  describe('Check the piano parts', () => {

    const pianoPartSet = partSet.selectPiano();
    pianoPartSet.forEach( (part, p) => {
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
            assert.equal(part.name, 'Piano', 'part name');

            assert.equal(noteOnCount, 9, 'noteOn count');

            assert.deepEqual([noteOnFirst.bar, noteOnFirst.beat], [1, 1],
                             'first noteOn');
            assert.deepEqual([noteOnLast.bar, noteOnLast.beat], [9, 1],
                             'last noteOn');
            assert.equal(noteOffLast.bar, 9, 'last noteOff bar');
            assertWithin(noteOffLast.beat, 4.75, 5, 'last noteOff beat');
            break;

          case 1:
            assert.equal(part.name, 'Piano', 'part name');

            assert.equal(noteOnCount, 9, 'noteOn count');

            assert.deepEqual([noteOnFirst.bar, noteOnFirst.beat], [1, 1],
                             'first noteOn');
            assert.deepEqual([noteOnLast.bar, noteOnLast.beat], [9, 1],
                             'last noteOn');
            assert.equal(noteOffLast.bar, 9, 'last noteOff bar');
            assertWithin(noteOffLast.beat, 2.75, 3, 'last noteOff beat');
            break;

          default:
            assert.fail(`extra part ${p} ${part.name}`);
            break;
        }
      });

    });

  });

  describe('Check the voice parts', () => {

    const voicePartSet = partSet.selectVoice();
    voicePartSet.forEach( (part, p) => {
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
            assert.equal(part.name, 'Soprano', 'part name');

            assert.equal(noteOnCount, 18, 'noteOn count');

            assert.deepEqual([noteOnFirst.bar, noteOnFirst.beat], [1, 1],
                             'first noteOn');
            assert.deepEqual([noteOnLast.bar, noteOnLast.beat], [9, 3],
                             'last noteOn');
            assert.equal(noteOffLast.bar, 9, 'last noteOff bar');
            assertWithin(noteOffLast.beat, 3.75, 4, 'last noteOff beat');
            break;

          case 1:
            assert.equal(part.name, 'Alto', 'part name');

            assert.equal(noteOnCount, 18, 'noteOn count');

            assert.deepEqual([noteOnFirst.bar, noteOnFirst.beat], [1, 2],
                             'first noteOn');
            assert.deepEqual([noteOnLast.bar, noteOnLast.beat], [9, 4],
                             'last noteOn');
            assert.equal(noteOffLast.bar, 9, 'last noteOff bar');
            assertWithin(noteOffLast.beat, 4.75, 5, 'last noteOff beat');
            break;

          case 2:
            assert.equal(part.name, 'Ténor', 'part name');

            assert.equal(noteOnCount, 36, 'noteOn count');

            assert.deepEqual([noteOnFirst.bar, noteOnFirst.beat], [1, 1],
                             'first noteOn');
            assert.deepEqual([noteOnLast.bar, noteOnLast.beat], [9, 4],
                             'last noteOn');
            assert.equal(noteOffLast.bar, 9, 'last noteOff bar');
            assertWithin(noteOffLast.beat, 4.75, 5, 'last noteOff beat');
            break;

          case 3:
            assert.equal(part.name, 'Baryton', 'part name');

            assert.equal(noteOnCount, 9, 'noteOn count');

            assert.deepEqual([noteOnFirst.bar, noteOnFirst.beat], [1, 1],
                             'first noteOn');
            assert.deepEqual([noteOnLast.bar, noteOnLast.beat], [9, 1],
                             'last noteOn');
            assert.equal(noteOffLast.bar, 9, 'last noteOff bar');
            assertWithin(noteOffLast.beat, 3.75, 4, 'last noteOff beat');
            break;

          default:
            assert.fail(`extra part ${p} ${part.name}`);
            break;
        }
      });

    });

  });

});
