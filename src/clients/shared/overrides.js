import JSON5 from 'json5';

const e = {};

export const overrides = {
  url: 'urlOverrides.json',
  score: 'scoreOverrides.json',
};
Object.assign(e, {overrides});

export async function fetch (sourceUrl) {
  return new Promise( (resolve, reject) => {
    const request = new window.XMLHttpRequest();
    request.open('GET', sourceUrl, true);

    // JSON5 is not json, use plain text to avoid error on JSON parsing
    request.responseType = 'text';

    request.onerror = () => {
      reject(new Error(`Unable to GET ${sourceUrl}, status ${request.status} `
                       + `${request.responseText}`) );
    };

    request.onload = () => {
      if (request.status < 200 || request.status >= 300) {
        request.onerror();
        return;
      }

      try {
        resolve(JSON5.parse(request.response) );
      } catch (error) {
        reject(new Error(`Error while parsing ${sourceUrl}: `
                         + error.message) );
      }
    };

    request.send(null);
  });
}
Object.assign(e, {fetch});

export async function fetchAll({baseUrl}) {
  const promises = {};

  for(const [entry, filename] of Object.entries(overrides) ) {
    promises[entry] = fetch(`${baseUrl}/${filename}`);
  }

  const resolutions = await Promise.all(Object.values(promises) );
  const results = {};
  Object.keys(promises).forEach( (key, index) => {
    results[key] = resolutions[index];
  });
  return results;
}
Object.assign(e, {fetchAll});

export default e;
