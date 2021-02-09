if(typeof window !== 'undefined'
   && window.hasOwnProperty('webkitAudioContext')
   && !window.hasOwnProperty('AudioContext')) {
  window.AudioContext = webkitAudioContext;
}
if(typeof window !== 'undefined'
   && window.hasOwnProperty('webkitOfflineAudioContext')
   && !window.hasOwnProperty('OfflineAudioContext')) {
  window.OfflineAudioContext = webkitOfflineAudioContext;
}
