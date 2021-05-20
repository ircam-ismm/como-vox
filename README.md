# CoMo - Vox

## Todo

Bugs:
 - [ ] intensity drops
   - [?] device compresses audio output when clipping?
 - [x] NaN in position
 - [x] no tempo adaptation on start

- [ ] calibrate latency
  - [x] tap tempo on metronome
  - [x] adapt look-ahead with latency and maximum tempo
  - [ ] clip with audio context values
- [x] beatTriggerFromGesturePeakAdapt: adapt inhibition to tempo and
      time-signature ++++++
- [x] data: bypass graph
  - [x] injection
  - [x] no more shared states via setGraphOptions
  - [x] graph simplification and optimisation
- [x] transport
  - [x] apply beat phase and tempo on beat change
- [ ] score
  - [x] BUG: first note is very short
  - [x] apply tempo and time-signature on load, even when playback is paused
  - [x] normalise
  - [ ] apply time-signature changes
  - [ ] transposition: advanced settings
  - [ ] choose bar (number or slider): advanced settings
  - [ ] start end, loop: advanced settings
- [ ] beating
  - [ ] ratio: 2, 1/2, 3, 1/3: advanced settings. In `transport.js`, adapt  `timeSignature.count`, `tempo` and `position.beat`. Should be transparent at output, except maybe for beat change.
- [ ] intensity
  - [x] lookahead: float 1/2 beat NO: better 1 quarter note
  - [x] smooth, specially on diminuendo
  - [ ] relative intensity
  - [ ] normalise score
  - [ ] hold when transport does not stop with beating
- [ ] global volume
  - [?] compressor
  - [?] reverb
- [x] start
- [x] end
  - [?] quicker
- [ ] UI
  - [ ] presets
    - [ ] UI
    - [ ] beating
    - [ ] generalisation
  - [ ] CSS
    - [x] no more in templates
    - [x] SCSS
  - [ ] users
  - [ ] debug
  - [ ] controller
- [ ] log
  - [ ] plugin logger
  - [ ] errors and log from clients
  - [ ] currents settings as meta-data
  - [ ] user-agent
  - [ ] audio settings


- [ ] application
  - [ ] nativ, (React, Flutter)
  - [ ] format: JSON or flat
  - [ ] transport: WebSocket or OSC over UDP
  - [ ] updates (via stores)


- [ ] server / host application 
  - connection
    - [ ] QR code: separate module
      - [ ] wifi
      - [ ] IP
      - [ ] port
    - [ ] à la bonjour
  -[ ] updates

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
- [x] projet radio france
  + [x] `client/index.js`
  + [x] `src/ScorePlayer.js`

- [x] MIDI parser
  + [x] metas
  + [x] master track
  + [x] one track per channel

- [x] MIDI player
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
- [x] calibrate sensors and audio
- [x] record users gestures with annotated video
- [x] prototype with user scripts

- [x] long loading time on iOS (1 minute): pinned certificate? connected once to https://apps.cosima.ircam.fr and update local certificates
  - [ ] DNS problem, should have a local one without catch-all and a remote with catch-all to avoid iOS time-outs


### Fabrice 

Tout d'abord levée et détente

Maintenant tu vas diriger

2/4 difficile, même endroit pour la levée et le temps.

4/4 ou 3/4

Huawei P8 Lite 2017


