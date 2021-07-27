import {html} from 'lit-html';

import {clock} from './clock.js';
import {gestureControl} from './gestureControl.js';
import {intensity} from './intensity.js';
import {latency} from './latency.js';
import {playback} from './playback.js';
import {position} from './position.js';
import {score} from './score.js';
import {session} from './session.js';
import {tempo} from './tempo.js';
import {timeSignature} from './timeSignature.js';
import {scenario} from './scenario.js';
import {sound} from './sound.js';

const e = {};

export function player(data) {
  return html`
    ${session(data)}
    ${clock(data)}
    ${latency(data)}
    ${scenario(data)}
    ${score(data)}
    ${tempo(data)}
    ${intensity(data)}
    ${timeSignature(data)}
    ${position(data)}
    ${playback(data)}
    ${intensity(data)}
    ${gestureControl(data)}
    ${sound(data)}
`;
}
Object.assign(e, {player});

export default e;
