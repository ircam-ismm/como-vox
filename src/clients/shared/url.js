import debounce from 'lodash.debounce';

import jsonURL from 'json-url';
const codec = jsonURL('lzstring');

import schema from '../../shared/schema.js';

const compressedKey = 'z';
const parametersSplitExpression = /[\?#&]+/;

let origin = window.location.origin;
if(!origin || origin === 'null') {
  origin = 'file://'
}


const compressed_overrides = {
  // from https://polr.ircam.fr/comovoxnuance until 2023/01/03
  'N4IghgrgJglg9gSQHYBcCmSDOMUE8BKYSA5miAFwDMATADTjTzLpY4FGkCqMFAZmABtMaepFhwAMmBYBjXAFk0YTBABOaKNwopVEESABGSlAHE0mFGrQB1MDhgkAImunwk8sAA8KdQ8YfEAMpwEEhQfILC9EauJMGhmjzk_EL6MgJwMgDWACowALZoWsmR-lBoBhDEAIKMcBGp9OWVNXXFKVEgpBZW1VBgAA4ornBIzBjYePJw5cU6evTdlup9g8Mobjlo-QNw07NJ8_pLVgDCozpwQgBCxgDyvLzCKA2dJ-rnqKpXmLfSD080Ch2qVFuZlmhPpchONWHhXsdwWcLt8YagJmw5rpET0PiifgAFARgXAGMDZQLDVQvEqNLpIvFfQnE0nkrKUsDUkF096Q_FCIkkskUlBwAYIsG4vlMgUs4Xs0UDblvBnS6GYLY7eq0lVSqGojXbXZYhb0qWwya4ZADCAoDzecgABgAdABWSUQi1sa22-3KnGe9Fwq1IG12jQwCD5fBoYkbABuZCdbo9Vi9eB94dgUZjcZgif9qfU6dwADk4Kp8oIYMIoIps_kKC6AOzus2BliW8uV6u1-uR_KFkAZOBZaoACyUUHL6EwMYAjnoLE3nQBGahtkdjydgadwWcLpfApIdfSFS5IOCFeJhbTY-jn76X68hMIm_QDOVsiUgT9CtnvvQf6siKnIoNUvDoKo5yhDSoBkqoFCrtExhNgAvkBX6gdSEFQTBqBDsB8qUmKuFoNBr5wYYnJISh0joZh_4iqRkHkfhx4_kRbIkQMgRoGgWQUCAFhgSAjEgQqYp8QJhEsuRCCJD-mAyBgnLwKcajqKgQnKapqhMEGlpicJKlIGpcAAGIQAIAiASZekGZ2mKHPe9lmfpkg1iwAR2bp7nwIKElKaZ5mBfKvkhR5mrGi5pp-eZ0WIIZzl3nFkXwBy1I8dYODjn8GwkBFFZqgaiWpfoynFfqPyJUOlWMuqeTXjAxBmRC5X0PVaAWTAAhoKWYCFEJBL4HcADSdwWQgACiABqAAE_RYGg83UAAtAALPNACcLr5DA4SdTIxUlucOzqJg2CjPaSHUI6R0ncleBnQMF1Xe4Dg9Z4GgUAAHPdJmPU5z1Xq95jvfIDhmFKSGrgDXWnaDb1uJD7heHVx3Fk9uAvcj10zEmDCisZCPY7j4MowTGNAxiGahrahAkGgjg1sB1PqL5FOjANhR1VzSB8X1MgbKMfMCQScCTG41ycpz4uS_Yoz5WLWQS1LowxiJXInqCIDoFqf3bc620m9trquo6luOtQG70PruwSAUOCYBQoBgAYmBXLaaCoxQG0A-7nsCN7N3kKuABsAPqHmia-8mzbh_Q0euLHXhIc61AbRhetGp5-0oJgQ723AdkbM1rXSFYrsgMdsE-E0-Y1m4fvZ2XaCBC1bVWHZEAwHcQxuC7OpoGhQAA': {
    scenarioCurrent: 'scenarioIntensity',
    scoreFileName: '1 - PROKOFIEV danse 2-4 90.mid',
  },
};

const e = {};

const UrlValidationPattern = new RegExp('^(ftp|http|https)://[^ "]+$');
const dataUrlValidationPAttern = new RegExp('^data:.*,[^ "]+$');
const blobValidationPattern = new RegExp('^blob:[^ "]+$');

export function type(URI) {
  let type;

  if(URI === null) {
    type = 'null';
  } else if(UrlValidationPattern.test(URI) ) {
    type = 'url';
  } else if (dataUrlValidationPAttern.test(URI) ) {
    type = 'dataUrl';
  } else if (blobValidationPattern.test(URI) ) {
    type = 'blob';
  } else {
    type = 'other';
  }

  return type;
}
Object.assign(e, {type});

// Base URI of window.location, without optional parameters.
// Be sure to include window.location.pathname to allow for non-root URL.
export const base = origin + window.location.pathname;
Object.assign(e, {base});

export function paramGet(name, defaultValue) {
  // do not use hash directly to be able to decode before getting hash
  const location = decodeURIComponent(window.location.href);
    const results = new RegExp('[\?&#]' + name + '=([^\?&#]*)').exec(location);
    if (results == null){
       return defaultValue;
    } else {
       return decodeURI(results[1]) || defaultValue;
    }
}
Object.assign(e, {paramGet});

export async function parse(clientSchema) {
  const data = {}

  // start with compressed values to allow for over-riding in the beginning of
  // the URL
  try {
    const compressed = paramGet(compressedKey, undefined);
    if (compressed) {
      const overrides = compressed_overrides[compressed];
      if(typeof overrides !== 'undefined') {
        Object.assign(data, overrides);
      } else {
        const decompressed = await codec.decompress(compressed);
        Object.assign(data, decompressed);
      }
    }
  } catch(error) {
    console.error(`Error while parsing compressed URL parameter '${compressedKey}': ${error.message}`);
  }

  const URI = window.location.href;
  let parametersArray = [];
  // split on search: first special character (any one)
  // remove URI: anything before
  const URIArray = URI.split(parametersSplitExpression);

  if (URIArray.length > 1) {
    parametersArray = URIArray.slice(1);
  }

  for (const parameterString of parametersArray) {
    // split on first '='
    const parameterArray = parameterString.split('=');

    if (parameterArray.length === 2) {
      const key = parameterArray[0];
      let value = parameterArray[1];

      try {
        if (key === compressedKey) {
          continue;
        } else {
          if (!clientSchema.hasOwnProperty(key)) {
            throw new Error(`Unkown parameter '${key}'`);
          }

          const type = clientSchema[key].type;

          if (type !== 'string') {
            value = JSON.parse(decodeURIComponent(value) );
          } else {
            value = decodeURIComponent(value);
          }

          if (type === 'boolean') {
            // coerce 0 and 0 to boolean
            value = (value ? true : false);
          }

          data[key] = value;
        }

      } catch(error) {
        console.error(`Error while parsing URL parameter '${key}': ${error.message}`);
      }

    }

  }

  return data;
}

Object.assign(e, {parse});

async function _update(clientSchema, data) {
  try {
    const exported = {}
    for (const key of Object.keys(data)) {
      if (schema.isExported(clientSchema, key) ) {
        exported[key] = data[key];
      }
    }
    const compressed = await codec.compress(exported);
    const pathname = window.location.pathname;
    const URL = `${origin}${pathname}#?${compressedKey}=${compressed}`;
    // window.location.replace(URL);
    window.location.hash = `?${compressedKey}=${compressed}`;
  } catch(error) {
    new Error('Error while updating URL:' + error.message);
  }
}

// limit URL update period to 500 ms
export const update = debounce(_update, 500);
Object.assign(e, {update});




export default e;
