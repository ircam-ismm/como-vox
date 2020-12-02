# CoMo - Vox

?? what to do with ??
- Intensity
- Kick

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

- [ ] Check that there is no interruption on orientation, when web page refreshes.

# Todo

See:
- [ ] projet radio france
  + [ ] `client/index.js`
  + [ ] `src/ScorePlayer.js`

- [ ] MIDI parser
  + [ ] metas
  + [ ] master track
  + [ ] one track per channel

- [ ] MIDI player


Sensors:
- [ ] calibrate senssors and audio
- [ ] record users gestures with annotated video
- [ ] prototype with user scripts

Tests:
- [ ] use Mocha & Chai

## CoMo


- [ ] connect *from* output?
- [ ] restart `npm run dev` after graph change?
- [ ] graph broken?
- [ ] script node?
- [ ] initial parameters for scripts
