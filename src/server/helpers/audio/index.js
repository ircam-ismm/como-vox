import monkeyPatch from './monkeyPatch.js';
import buffer from './buffer.js'
import {CompressorNode} from './CompressorNode.js';
import {ReverberatorNode} from './ReverberatorNode.js';

export default {
  ...buffer,
  CompressorNode,
  ReverberatorNode,
};
