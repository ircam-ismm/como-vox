# CoMo - Vox

## Todo

- [ ] avoid navigation gestures (swipe from left, swipe from top, etc.)
- [ ] calibrate latency
- [ ] beatTriggerFromGesturePeakAdapt: adapt inhibition to tempo & time-signature ++++++
- [ ] score
  - [ ] normalise
  - [ ] apply time-signature changes
- [ ] intensity
  - [ ] lookahead: float 1/2 beat NO: better 1 quarter note ++++++++
  - [ ] relative intensity
  - [ ] normalise score
- [ ] global volume
  - [x] compressor
  - [x] reverb
- [ ] start
- [ ] end
- [ ] UI
  - [ ] users
  - [ ] debug
  - [ ] controller


**Projects are dedicated to exercices types:**

- beat mock
- intensity mock

exercices
- intensity (auto beat)
- beat
- mesure 2
- mesure 3
- mesure 4

intensity is handled by the player (use or not the value)

-> select an exercice

-> select a score (metronome or score)
    -> load related files
    -> audio files + score + metas (signature - tempo)

-> start | pause | stop
    -> we need to speak to the audio engine from outside...

## Network

### TLS

`apps.ismm.ircam.fr` for Let'e Encrypt TLS certificate. Register a simpler domain name?

If there is an error related to certificate, check system clock first, then on-line certificate at <https://apps.ismm.ircam.fr/>

### Subnetwork

Currently 192.168.1.110-253 in order to comply with R-IoT.

Should we change to 10.0.*.* or even 10.149.*.* to avoid collision?

## Sensors

- [x] Check that there is no interruption on orientation, when web page refreshes.

# Todo

See:
- [ ] projet radio france
  + [ ] `client/index.js`
  + [ ] `src/ScorePlayer.js`

- [x] MIDI parser
  + [x] metas
  + [x] master track
  + [x] one track per channel

- [ ] MIDI player
  - [BAD] MIDI.js: broken on iOS, broken timing, 
  
- soundfonts: re-compress from original sf2 (bad compression from MIDI.js)
  
```javascript
MIDI.loadPlugin({
  soundfontUrl: './soundfonts/',
  instrument: 'acoustic_grand_piano',
  // instruments: ['acoustic_grand_piano', 'choir_aahs-mp3'],
  targetFormat: 'mp3',
  api: 'webaudio',
  onsuccess: () => console.log('ok'),
});

// MIDI.Plugin.js

midi.setVolume
midi.noteOn(channelId, noteId, velocity, delay)
midi.noteOff = function(channelId, noteId, delay)
midi.stopAllNotes = function()

if(typoef window.audioContext === 'undefined') {
  window.audioContext = webkitAudioContext;
}
midi.setContext = function(newCtx, onload, onprogress, onerror)
midi.connect = function(opts) 

```

Warning: No sleep on iOS < 10 can block network requests.

Warning: after boot: launch Safari, and sound, quit safari (double click and drag out). restart safari. reload page.


Sensors:
- [ ] calibrate senssors and audio
- [ ] record users gestures with annotated video
- [ ] prototype with user scripts

- [x] long loading time on iOS (1 minute): pinned certificate? connected once to https://apps.cosima.ircam.fr and update local certificates


### Fabrice 

Tout d'abord levée et détente

Maintenant tu vas diriger

2/4 difficile, même endroit pour la levée et le temps.

4/4 ou 3/4

Huawei P8 Lite 2017


