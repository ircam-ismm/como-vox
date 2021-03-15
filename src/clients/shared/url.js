const e = {};

import schema from '../../shared/schema.js';

let origin = window.location.origin;
if(!origin || origin === 'null') {
  origin = 'file://'
}

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

export function parse(clientSchema) {

  const data = {};

  for(const [key, entry] of Object.entries(clientSchema) ) {
    if(!schema.isExported(clientSchema, key) ) {
      continue;
    }

    const defaultValue = schema.getDefaultValue(clientSchema, key);
    const value = paramGet(key, defaultValue);

    data[key] = value;
  }

  console.log("data = ", data);

  return data;
}
Object.assign(e, {parse} );

export function update(data) {

  const pathname = window.location.pathname;

  let location = origin + pathname
    + '#'
    + '?navigation=' + data.navigation;

  if(data.event) {
    location += '&event=' + data.event;
  }

  if(data.pass) {
    location += '&pass=' + data.pass;
  }

  if(data.eventExtra) {
    location += '&event-extra=' + data.eventExtra;
  }

  if(data.passExtra) {
    location += '&pass-extra=' + data.passExtra;
  }

  if(data.debug) {
    location += '&debug=' + data.debug;
  }

  window.location = location;

}
Object.assign(e, {update});




export default e;
