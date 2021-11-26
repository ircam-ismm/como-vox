import {html} from 'lit-html';

import {audioIntensity} from './audioIntensity.js';
import {clock} from './clock.js';
import {gestureControl} from './gestureControl.js';
import {gestureIntensity} from './gestureIntensity.js';
import {gestureAdaptation} from './gestureAdaptation.js';
import {latency} from './latency.js';
import {playback} from './playback.js';
import {position} from './position.js';
import {scenario} from './scenario.js';
import {scoreIntensity} from './scoreIntensity.js';
import {score} from './score.js';
import {session} from './session.js';
import {sound} from './sound.js';
import {tempo} from './tempo.js';
import {timeSignature} from './timeSignature.js';

const e = {};

export function player(data) {
  return html`
    ${session(data)}
    ${clock(data)}
    ${latency(data)}
    ${gestureAdaptation(data)}
    ${scenario(data)}
    ${score(data)}
    ${tempo(data)}
    ${audioIntensity(data)}
    ${scoreIntensity(data)}
    ${gestureIntensity(data)}
    ${timeSignature(data)}
    ${position(data)}
    ${playback(data)}
    ${gestureControl(data)}
    ${sound(data)}
`;
}
Object.assign(e, {player});

export default e;
