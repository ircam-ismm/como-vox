if(typeof window !== 'undefined'
   && window.hasOwnProperty('webkitOfflineAudioContext')
   && !window.hasOwnProperty('OfflineAudioContext')) {
  window.OfflineAudioContext = webkitOfflineAudioContext;
}
