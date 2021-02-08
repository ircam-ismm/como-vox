const e = {};

// Base URI of window.location, without optional parameters.
// Be sure to include window.location.pathname to allow for non-root URL.
export const base = window.location.origin + window.location.pathname;
Object.assign(e, {base});

export function paramGet (name){
  // do not use hash directly to be able to decode before getting hash
  const location = decodeURIComponent(window.location.href);
    const results = new RegExp('[\?&#]' + name + '=([^\?&#]*)').exec(location);
    if (results == null){
       return null;
    }
    else {
       return decodeURI(results[1]) || null;
    }
}
Object.assign(e, {paramGet});

export default e;
