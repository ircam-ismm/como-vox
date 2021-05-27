const e = {};

let enabled = true;
export function isEnabled() {
  return enabled;
}
Object.assign(e, {isEnabled});

// separate from other applications on the same server
const prefix = 'comovox_';

const prefixRegexp = new RegExp(`^${prefix}`);
function keyIsPrefixed(key) {
  return prefixRegexp.test(key);
}

export function save(key, value) {
  if(!enabled) {
    return false;
  }

  try {
    window.localStorage[`${prefix}${key}`] = JSON.stringify(value);
  } catch(error) {
    enabled = false;
  }
  return enabled;
}
Object.assign(e, {save});

export function load(key) {
  if(!enabled) {
    return undefined;
  }

  let value;
  try {
    value = window.localStorage[`${prefix}${key}`];
    if(typeof value !== 'undefined') {
      value = JSON.parse(value);
    }
  } catch(error) {
    enabled = false;
  }
  return (enabled ? value : undefined);
}
Object.assign(e, {load});

export function clear(key) {
  if(!enabled) {
    return false;
  }

  try {
    delete localStorage[`${prefix}${key}`];
  } catch(error) {
    enabled = false;
  }
  return enabled;
}
Object.assign(e, {clear});

export function clearAll() {
  if(!enabled) {
    return false;
  }

  try {
    for(const key of Object.keys(localStorage) ) {
      if(keyIsPrefixed(key) ) {
        delete localStorage[key];
      }
    }
  } catch(error) {
    enabled = false;
  }
  return enabled;
}
Object.assign(e, {clearAll});

export default e;
