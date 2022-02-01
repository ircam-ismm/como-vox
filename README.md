# CoMo - Vox

## Todo

### V1

- [ ] Calibration
  - [ ] faire un vrai mode de scénario
  - [ ] mettre un bouton dans l'interface principale (réduire le logo)
  - [ ] quand on clique sur tempo et qu'on calibre la première fois, il faudrait revenir à tempo (et pas à nuance, le mode précédent)

- [ ] Départ : affichage du play suivant `scenarioPlayback`

Jean-Philippe :
- [ ] latence min / max
- [ ] info : dire « trop tôt » et « trop tard » plutôt qu'annulé pour la calibration et la latence
- [ ] mise à jour des morceaux
  - [ ] Haendel à 74 à la blanche
  - [ ] Mozart à 82
  - [ ] enlever les morceaux inutiles ou de mauvaise qualité

- [x] Permettre de charger un fichier (bien pour tester les nouvelles partitions
- [x] Permettre de charger une URL
  - [x] depuis l'interface et depuis un paramètre

  - [ ] messages locaux dans l'interface (1 à 2 secondes pour attendre la mise en route ou l'arrêt c'est trop long, ne coupe pas si déconnecté)
  - [ ] vérifier les messages qui transitent par le réseau en continu (ralentissement de pire en pire au fur et à mesure de l'utilisation)
    - [ ] sur le serveur
    - [ ] en retour dans le client
- [x] parfois le “merci" de la calibration est double
  - doublage des messages sur le réseau, `scenarioStatus` plus exporté dans le schéma
  - mise du statut à `on` lors de l'activation d'un scénario
- [x] parfois il y a un intervalle de temps trop grand entre le premier bip (aigu) et les suivants, comme s’il freezait un instant ; on peut aussi avoir le départ avec trop peu de pré-compte (réinitialisation de l'offset dans le transport ?, du lissage ?)
  - [x] lorsqu'on contrôle le tempo
  - [x] aussi lorsqu'on a contrôlé le tempo (mode tempo puis nuance), aussi en écoute
  - [x] en général ?
    - [x] vérifier le transport
      - [x] vérifier les **2** versions
      - [x] réinitialisation
        - [x] d'une version à l'autre
        - [x] offset
        - [x] vitesse
- [ ] sur l’android, il tourne parfois en rond après la calibration (comme s’il n’arrivait pas à enregistrer)
- [à vérifier] Sur iphone: le metronome est super fort dans les nuances faible (en mode nuance) au point d’être "gênant". Mais c’est bien sur android (on filmera avec l’android, ou sans metronome). J’imagine que c’est lié à la compression. 
  - [x] Je me demande s’il ne faudrait pas que le métronome suive aussi (un peu) l’intensité. (Bonne idée)
- [x] restaurer le scénario courant à partir de l'URL
- [x] restaurer le tempo et la partition à partir de l'URL (forcer pour le prochain chargement au décodage de l'URL)
  - [x] le tempo est remplacé par celui de la partition après le chargement complet
  - [x] échantillonnage des capteurs

- [x] erreur au chargement de la réverbération
- [x] remise compresseur et réverbe
- [x] mise en ligne d’une version pour s’entraîner (Morgan et Marie-Noëlle)
- [x] simplification de la procédure de calibration
- [x] calibrer avec un tempo à 70 ?
- [x] réglage de latence (faciliter l'accélération ou le ralenti) : [-] [neutre] [+]
- [x] réglage de la plage de dynamique [-] [neutre] [+]
- [x] départ : possibilité d’écouter l’original

- [x] define logs
  - [x] plugin logger
  - [x] errors and log from clients
  - [ ] currents settings as meta-data
  - [x] user-agent
  - [x] audio settings (latency)


Benjamin (deadline 17/01) :

- [x] @soundworks/template-helpers
  + [x] éviter le rechargement de la page à la mise à jour de l'URL. (À cause de la qualité de service ?) - 
  + [x] forcer le rechargement si l'onglet était en pause (QoS ?)
  
  -> update to `@soundworks/template-helpers#v1.2.3`

- [x] soundworks
  + [x] mot de passe pour les autres clients (script-editor, controller)  : faire une configuration prod ? (bien aussi si tout le temps)
    -> cf. config/env/default.json - on peut effectivement faire une config par environnement.  
  + [x] vérifier une foix que les en-têtes de serveur de sécurité sont à jour (CORS, COOP, COEP)

  -> update to `@soundworks/core#v3.1.0-beta.5` 

- [ ] `render()`
  + [x] ajouter des `this.render()`
  + [?] le tempo de référence n'est pas mis à jour au chargement d'un nouveau morceau - à checker (affichage) manque un `render()`
    -> ok de mon côté...
  + [ ] l'affichage du tempo courant ne suit pas (c’est ce que l’on voulait finalement ?); C’est pas si mal de pouvoir jeter un oeil de temps en temps. en mode le départ: le tempo du départ s’affiche se met à jour, puis ne bouge plus jusqu’au stop. Cette mise à jour “à moitié” est troublante. (ajouter un `this.render()` de temps en temps ?)

  -> pas pris de borne... again...

- [x] fonts... (cf. old soundworks)

- [x] ajouter les logs (1 fichier par client) - install service
  - [x] général, pour l'utilisation
  - [x] erreurs, à test `window.addEventListener('error', err => {});``
  - [x] latence et user-agent 

-> needs
- [x] Pas de battue possible avec Firefox
  - [x] au moins un message d'erreur

  -> Cops, etc. did change anything, still 0.1s

- [x] traduire la page s'il n'y a pas d'accès aux capteurs (`sorry, this applications...`);
  cf. `client/views-mobile/sorry.js`

- [x] "/" dans l'adresse
  + [x] hotfix - logo image
  + [ ] à tester
  + [ ] server - review url rewrite rules (check with system)

- [x] maquette logo + credits (cf. texte videos google.doc)
  cf. texte https://docs.google.com/document/d/1lqyqzASAxUw7EB59kRg7J7bpDhu88fW9/edit
  
- [?] enlever la sélection du texte sur l'interface
- [?] sélectionner le texte des `input` en édition (pour remplacer facilement le chiffre)

Fred :
- [x] texte crédits
- [x] définir où on met les logos

### Questions courantes (FAQ)

- [ ] ajustement du tempo
  - [ ] "+" si battue en avance
  - [ ] "-" si difficile d'accélérer
- [ ] ajustement d la dynamique
  - [ ] "+" si battue en avance
  - [ ] "-" si difficile d'accélérer
- [ ] des fois, il n'y a pas accès au capteurs (revient après quitter et relancer Chrome)
- [ ] des fois, ça marche pas -> recharger la page..., 
      => ça ne marche toujours pas -> quitter le navigateur et relancer

### V2

Jean-Philippe :

- [ ] possibilité d'avoir des accents (sur le temps) en mode `nuances`

- [ ] après un arrêt, reprise depuis la mesure courante
- [ ] transposition
- [ ] beating
  - [ ] ratio: 2, 1/2, 3, 1/3: advanced settings. In `transport.js`, adapt  `timeSignature.count`, `tempo` and `position.beat`. Should be transparent at output, except maybe for beat change.

Benjamin :

- [x] essayer la fonction de duplication de l’audio, @note: c'est mort...

latence
+ [ ] à tester truc padenot

### Dev

Everywhere (see scenarios):
- [x] speech for feedback

  - [x] "c'est à vous"
  - [x] "trop tôt"
  - [x] "trop rapide"
  
  Indications :
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
- [x] from file
- [x] from URL

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
- [x] intensity
  - [x] lookahead: float 1/2 beat NO: better 1 quarter note
  - [x] smooth, specially on diminuendo
  - [x] relative intensity
  - [x] normalise score
  - [? hold when transport does not stop with beating
- [x] global volume
  - [x] compressor
  - [x] reverb
- [x] start
- [x] end
- [ ] UI
  - [x] URL: load state `z` after specific to allow for easy overrides.
  - [prod, todo develop-editor-config] do not update on `requestnimationFrame`
  - [?] presets
    - [ ] UI
    - [ ] beating
    - [ ] generalisation
  - [x] CSS
    - [x] no more in templates
    - [x] SCSS
  - [ ] users
  - [ ] debug
  - [ ] controller

- [ ] application mobile (février)
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

10.10.x.x

> https://forge-2.ircam.fr/ismm/network/

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


