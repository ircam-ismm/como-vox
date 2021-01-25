const e = {};

const notesDefault = [];
// piano: A0 to C8
for(let n = 21; n <= 108; ++n) {
  notesDefault.push(n);
}

export class SampleManager {
  constructor({
    audioContext,
    baseUrl,
  } = {}) {
    this.audioContext = audioContext;
    this.baseUrl = baseUrl,

    this.samplesLoading = new Map();
    this.samples = new Map();
  }

  async update({
    notes = notesDefault,
  } = {}) {
    const notesRequest = new Set([...notes]); // array or set

    this.samplesLoading.forEach( (loading, pitch) => {
      if(!notesRequest.has(pitch) ) {
        loading.cancel();
      }
    });

    this.samples.forEach( (sample, pitch) => {
      if(!notesRequest.has(pitch) ) {
        this.samples.delete(pitch);
      }
    });

    const notesNew = [...notesRequest].filter( (pitch) => {
      return !this.samplesLoading.get(pitch)
        && !this.samples.get(pitch);
    });

    const promises = [];
    notesNew.forEach( (pitch) => {
      const promise = new Promise( (resolve, reject) => {
        const request = new window.XMLHttpRequest();
        const sourceUrl = `${this.baseUrl}/${pitch}.mp3`;
        request.open('GET', sourceUrl, true);
        request.responseType = 'arraybuffer'; // binary data

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
            this.audioContext.decodeAudioData(request.response, (buffer) => {
              this.samples.set(pitch, buffer);
              this.samplesLoading.delete(pitch);
              resolve();
            });
          } catch (error) {
            this.samplesLoading.delete(pitch);
            reject(new Error(`Error while decoding audio file ${sourceURI}: `
                             + error.message) );
          }
        };

        const cancel = () => {
          if(!this.samplesLoading.get(pitch) ) {
            return;
          }

          request.abort();
          this.samplesLoading.delete(pitch);
          resolve();
        };

        this.samplesLoading.set(pitch, {cancel});

        request.send(null);
      });

      promises.push(promise);
    });

    return Promise.all(promises);
  }

  get(pitch) {
    return (this.samples.get(pitch) );
  }


};
Object.assign(e, {SampleManager});

export default e;
