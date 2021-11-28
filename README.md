# CoMo - Vox

## Todo

Jean-Philippe :
- [x] parfois le “merci" de la calibration est à double
  - doublage des messages sur le réseau, `scenarioStatus` plus exporté dans le schéma
  - mise du statut à `on` lors de l'activation d'un scénario
- [ ] sur Tempo, parfois il y a un intervalle de temps trop grand entre le premier bip (aigu) et les suivants, comme s’il freezait un instant (réinitialisation de l'offset dans le transport ?, du lissage ?)
- [ ] sur l’android, il tourne parfois en rond après la calibration (comme s’il n’arrivait pas à enregistrer)
- [ ] Sur iphone: le metronome est super fort dans les nuances faible (en mode nuance) au point d’être "gênant". Mais c’est bien sur android (on filmera avec l’android, ou sans metronome). J’imagine que c’est lié à la compression. Je me demande s’il ne faudrait pas que le métronome suive aussi (un peu) l’intensité. (Bonne idée)
- [ ] restaurer le scénario courant à partir de l'URL
- [ ] restaurer le tempo et la partition à partir de l'URL (forcer pour le prochain chargement au décodage de l'URL)
- [x] erreur au chargement de la réverbération
- [ ] après un arrêt, reprise depuis la mesure courante

Benjamin :
- [ ] le tempo courant ne suit pas (c’est ce que l’on voulait finalement ?); C’est pas si mal de pouvoir jeter un oeil de temps en temps. en mode le départ: le tempo du départ s’affiche se met à jour, puis ne bouge plus jusqu’au stop. Cette mise à jour “à moitié” est troublante. (ajouter un `this.render() de temps en temps ?)
- [ ] mot de passe pour les autres clients (script-editor, controller)  : faire une configuration prod ? (bien aussi si tout le temps)
- [ ] forcer le rechargement si l'onglet était en pause (QoS ?)
- [ ] traduire la page s'il n'y a pas d'accès aux capteurs

- [ ] essayer la fonction de duplication de l’audio (semble cassé)

- [x] mise en ligne d’une version pour s’entraîner (Morgan et Marie-Noëlle)
- [x] simplification de la procédure de calibration
- [x] calibrer avec un tempo à 70 ?
- [x] réglage de latence (faciliter l'accélération ou le ralenti) : [-] [neutre] [+]
- [x] réglage de la plage de dynamique [-] [neutre] [+]
- [x] départ : possibilité d’écouter l’original

- [x] mise à jour de l'interface seulement aux changements
  - [x] ajouter des `this.render()`
- [x] remise compresseur et réverbe

Everywhere (see scenarios):
- [x] speech for feedback

  - [x] "c'est à vous"
  - [x] "trop tôt"
  - [x] "trop rapide"
  
  Indications :
  - [ ] tempo reached
  - [ ] too fast / too slow (10%)
  
  Calibration:
  - [x] start on silence
  - [x] do not stop on gesture before start

Metronome:
- rename to 'beep' ou 'click'

Quality of Service
- do not disconnect (fine with local-only)

Load MIDI
- [ ] from file
- [ ] from URL

Bugs:
 - [x] intensity drops
   - [x] device compresses audio output when clipping?
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
  - [x] choose bar (number or slider): advanced settings
  - [ ] start end, loop: advanced settings
- [ ] beating
  - [ ] ratio: 2, 1/2, 3, 1/3: advanced settings. In `transport.js`, adapt  `timeSignature.count`, `tempo` and `position.beat`. Should be transparent at output, except maybe for beat change.
- [ ] intensity
  - [x] lookahead: float 1/2 beat NO: better 1 quarter note
  - [x] smooth, specially on diminuendo
  - [x] relative intensity
  - [x] normalise score
  - [ ] hold when transport does not stop with beating
- [ ] global volume
  - [x] compressor
  - [x] reverb
- [x] start
- [x] end
  - [?] quicker
- [ ] UI
  - [x] URL: load state `z` after specific to allow for easy overrides.
  - [prod, todo develop-editor-config] do not update on `requestnimationFrame`
  - [ ] presets
    - [ ] UI
    - [ ] beating
    - [ ] generalisation
  - [x] CSS
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
  - [ ] audio settings (latency)


- [ ] application
  - [ ] native, (React, Flutter)
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


