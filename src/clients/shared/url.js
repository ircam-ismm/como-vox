import debounce from 'lodash/debounce';

import jsonURL from 'json-url';
const codec = jsonURL('lzstring');

import schema from '../../shared/schema.js';

const compressedKey = 'z';
const parametersSplitExpression = /[\?#&]+/;

let origin = window.location.origin;
if(!origin || origin === 'null') {
  origin = 'file://'
}

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

export async function parse(clientSchema, {overrides}) {
  const data = {}

  // start with compressed values to allow for over-riding in the beginning of
  // the URL
  try {
    const compressed = paramGet(compressedKey, undefined);
    if (compressed) {
      const overriden = overrides.z[compressed];
      if(typeof overriden !== 'undefined') {
        Object.assign(data, overriden);
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
