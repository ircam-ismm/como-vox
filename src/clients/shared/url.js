const e = {};

export function paramGet (name){
  // do not use hash directly to be able to decode before getting hash
  const location = decodeURIComponent(window.location.href);
    const results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(location);
    if (results == null){
       return null;
    }
    else {
       return decodeURI(results[1]) || null;
    }
}
Object.assign(e, {paramGet});

export default e;
