import jsonURL from 'json-url';
const codec = jsonURL('lzstring');

import schema from '../../shared/schema.js';

const compressedKey = 'z';
const searchSplitExpression = '?';
const parametersSplitExpression = /[\?#&]/;

let origin = window.location.origin;
if(!origin || origin === 'null') {
  origin = 'file://'
}

const e = {};

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
    }
    else {
       return decodeURI(results[1]) || defaultValue;
    }
}
Object.assign(e, {paramGet});

export async function parse(clientSchema) {
  const URI = window.location.href;

  let parametersString = '';
  // split on first '?'
  const URIArray = URI.split(searchSplitExpression);
  if(URIArray.length > 1) {
    parametersString = URIArray[1];
  }

  const data = {}

  const parametersArray = parametersString.split(parametersSplitExpression);
  for(const parameterString of parametersArray) {

    // split on first '='
    const parameterArray = parameterString.split('=');
    if(parameterArray.length === 2) {
      const key = parameterArray[0];
      let value = parameterArray[1];
      try {
        if(key === compressedKey && value.length > 0) {
          const decompressed = await codec.decompress(value);
          Object.assign(data, decompressed);
        } else {
          if(!clientSchema.hasOwnProperty(key)) {
            throw new Error(`Unkown parameter '${key}'`);
          }

          const type = clientSchema[key].type;

          if(type !== 'string') {
            value = JSON.parse(value);
          }

          if(type === 'boolean') {
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
Object.assign(e, {parse} );

export async function update(clientSchema, data) {
  try {
    const exported = {}
    for(const key of Object.keys(data) ) {
      if(schema.isExported(clientSchema, key) ) {
        exported[key] = data[key];
      }
    }
    const compressed = await codec.compress(exported);
    const pathname = window.location.pathname;
    const URL = `${origin}${pathname}#?${compressedKey}=${compressed}`;
    window.location.replace(URL);
  } catch(error) {
    new Error('Error while updating URL:' + error.message);
  }

}
Object.assign(e, {update});




export default e;
