#!/usr/bin/env ruby
# coding: utf-8
#
#####  Quickly adapted from https://github.com/gleitz/MIDI.js
#
#
# JavaScript Soundfont Builder for MIDI.js
# Author: 0xFE <mohit@muthanna.com>
#
# Requires:
#   Ruby ≥ 2.4
#
#   FluidSynth
#   Lame
#   OggEnc (from vorbis-tools)
#   SOX
#   Ruby Gems: midilib parallel
#
#   $ brew install fluidsynth vorbis-tools lame sox (on OSX)
#   $ gem install midilib parallel
#
# You'll need to download a GM soundbank to generate audio.
#
# Usage:
#
# 1) Install the above dependencies.
# 2) Edit BUILD_DIR, SOUNDFONT, and INSTRUMENTS as required.
# 3) Run without any argument.

raise "Needs ruby version 2.4 or above" unless RUBY_VERSION.to_f >= 2.4

require 'base64'
require 'fileutils'
require 'midilib'
require 'parallel'
require 'digest/sha1'
include FileUtils

BUILD_DIR = "../assets/soundfonts-new"  # Output path
# SOUNDFONT = "./FluidR3_GM.sf2" # Soundfont file path
SOUNDFONT = "./MuseScore_General.sf3" # Soundfont file path

# See https://musescore.org/en/handbook/soundfonts-and-sfz-files#install

# This script will generate instrument sound-files for
# all instruments in the below array. Add or remove as necessary.
INSTRUMENTS = [
  0,   # Acoustic Grand Piano
  1,   # Bright Acoustic Piano
  # 2,   # Electric Grand Piano
  # 3,   # Honky-tonk Piano
  # 4,   # Electric Piano 1
  # 5,   # Electric Piano 2
  # 6,   # Harpsichord
  # 7,   # Clavinet
  # 8,   # Celesta
  # 9,   # Glockenspiel
  # 10,  # Music Box
  # 11,  # Vibraphone
  # 12,  # Marimba
  # 13,  # Xylophone
  # 14,  # Tubular Bells
  # 15,  # Dulcimer
  # 16,  # Drawbar Organ
  # 17,  # Percussive Organ
  # 18,  # Rock Organ
  # 19,  # Church Organ
  # 20,  # Reed Organ
  # 21,  # Accordion
  # 22,  # Harmonica
  # 23,  # Tango Accordion
  # 24,  # Acoustic Guitar (nylon)
  # 25,  # Acoustic Guitar (steel)
  # 26,  # Electric Guitar (jazz)
  # 27,  # Electric Guitar (clean)
  # 28,  # Electric Guitar (muted)
  # 29,  # Overdriven Guitar
  # 30,  # Distortion Guitar
  # 31,  # Guitar Harmonics
  # 32,  # Acoustic Bass
  # 33,  # Electric Bass (finger)
  # 34,  # Electric Bass (pick)
  # 35,  # Fretless Bass
  # 36,  # Slap Bass 1
  # 37,  # Slap Bass 2
  # 38,  # Synth Bass 1
  # 39,  # Synth Bass 2
  # 40,  # Violin
  # 41,  # Viola
  # 42,  # Cello
  # 43,  # Contrabass
  # 44,  # Tremolo Strings
  # 45,  # Pizzicato Strings
  # 46,  # Orchestral Harp
  # 47,  # Timpani
  # 48,  # String Ensemble 1
  # 49,  # String Ensemble 2
  # 50,  # Synth Strings 1
  # 51,  # Synth Strings 2
  52,  # Choir Aahs
  # 53,  # Voice Oohs
  # 54,  # Synth Choir
  # 55,  # Orchestra Hit
  # 56,  # Trumpet
  # 57,  # Trombone
  # 58,  # Tuba
  # 59,  # Muted Trumpet
  # 60,  # French Horn
  # 61,  # Brass Section
  # 62,  # Synth Brass 1
  # 63,  # Synth Brass 2
  # 64,  # Soprano Sax
  # 65,  # Alto Sax
  # 66,  # Tenor Sax
  # 67,  # Baritone Sax
  # 68,  # Oboe
  # 69,  # English Horn
  # 70,  # Bassoon
  # 71,  # Clarinet
  # 72,  # Piccolo
  # 73,  # Flute
  # 74,  # Recorder
  # 75,  # Pan Flute
  # 76,  # Blown Bottle
  # 77,  # Shakuhachi
  # 78,  # Whistle
  # 79,  # Ocarina
  # 80,  # Lead 1 (square)
  # 81,  # Lead 2 (sawtooth)
  # 82,  # Lead 3 (calliope)
  # 83,  # Lead 4 (chiff)
  # 84,  # Lead 5 (charang)
  # 85,  # Lead 6 (voice)
  # 86,  # Lead 7 (fifths)
  # 87,  # Lead 8 (bass + lead)
  # 88,  # Pad 1 (new age)
  # 89,  # Pad 2 (warm)
  # 90,  # Pad 3 (polysynth)
  # 91,  # Pad 4 (choir)
  # 92,  # Pad 5 (bowed)
  # 93,  # Pad 6 (metallic)
  # 94,  # Pad 7 (halo)
  # 95,  # Pad 8 (sweep)
  # 96,  # FX 1 (rain)
  # 97,  # FX 2 (soundtrack)
  # 98,  # FX 3 (crystal)
  # 99,  # FX 4 (atmosphere)
  # 100, # FX 5 (brightness)
  # 101, # FX 6 (goblins)
  # 102, # FX 7 (echoes)
  # 103, # FX 8 (sci-fi)
  # 104, # Sitar
  # 105, # Banjo
  # 106, # Shamisen
  # 107, # Koto
  # 108, # Kalimba
  # 109, # Bagpipe
  # 110, # Fiddle
  # 111, # Shanai
  # 112, # Tinkle Bell
  # 113, # Agogo
  # 114, # Steel Drums
  # 115, # Woodblock
  # 116, # Taiko Drum
  # 117, # Melodic Tom
  # 118, # Synth Drum
  # 119, # Reverse Cymbal
  # 120, # Guitar Fret Noise
  # 121, # Breath Noise
  # 122, # Seashore
  # 123, # Bird Tweet
  # 124, # Telephone Ring
  # 125, # Helicopter
  # 126, # Applause
  # 127, # Gunshot
]

# It was found that midilib uses names that are incompatible with MIDI.js
# For example, midilib uses "SynthBrass 1" -> https://github.com/jimm/midilib/blob/6c8e481ae72cd9f00a38eb3700ddfca6b549f153/lib/midilib/consts.rb#L280
# and the MIDI association uses "SynthBrass 1" -> https://www.midi.org/specifications-old/item/gm-level-1-sound-set
# but the MIDI.js calls this "Synth Brass 1" -> https://github.com/mudcube/MIDI.js/blob/a8a84257afa70721ae462448048a87301fc1554a/js/midi/gm.js#L44
# there are others like "Bag pipe" vs "Bagpipe", etc.
# here, we use the MIDI.js definitions because that is how most users will interact with the generated soundfonts.
MIDIJS_PATCH_NAMES = [
  "Acoustic Grand Piano",
  "Bright Acoustic Piano",
  "Electric Grand Piano",
  "Honky-tonk Piano",
  "Electric Piano 1",
  "Electric Piano 2",
  "Harpsichord",
  "Clavinet",
  "Celesta",
  "Glockenspiel",
  "Music Box",
  "Vibraphone",
  "Marimba",
  "Xylophone",
  "Tubular Bells",
  "Dulcimer",
  "Drawbar Organ",
  "Percussive Organ",
  "Rock Organ",
  "Church Organ",
  "Reed Organ",
  "Accordion",
  "Harmonica",
  "Tango Accordion",
  "Acoustic Guitar (nylon)",
  "Acoustic Guitar (steel)",
  "Electric Guitar (jazz)",
  "Electric Guitar (clean)",
  "Electric Guitar (muted)",
  "Overdriven Guitar",
  "Distortion Guitar",
  "Guitar Harmonics",
  "Acoustic Bass",
  "Electric Bass (finger)",
  "Electric Bass (pick)",
  "Fretless Bass",
  "Slap Bass 1",
  "Slap Bass 2",
  "Synth Bass 1",
  "Synth Bass 2",
  "Violin",
  "Viola",
  "Cello",
  "Contrabass",
  "Tremolo Strings",
  "Pizzicato Strings",
  "Orchestral Harp",
  "Timpani",
  "String Ensemble 1",
  "String Ensemble 2",
  "Synth Strings 1",
  "Synth Strings 2",
  "Choir Aahs",
  "Voice Oohs",
  "Synth Choir",
  "Orchestra Hit",
  "Trumpet",
  "Trombone",
  "Tuba",
  "Muted Trumpet",
  "French Horn",
  "Brass Section",
  "Synth Brass 1",
  "Synth Brass 2",
  "Soprano Sax",
  "Alto Sax",
  "Tenor Sax",
  "Baritone Sax",
  "Oboe",
  "English Horn",
  "Bassoon",
  "Clarinet",
  "Piccolo",
  "Flute",
  "Recorder",
  "Pan Flute",
  "Blown Bottle",
  "Shakuhachi",
  "Whistle",
  "Ocarina",
  "Lead 1 (square)",
  "Lead 2 (sawtooth)",
  "Lead 3 (calliope)",
  "Lead 4 (chiff)",
  "Lead 5 (charang)",
  "Lead 6 (voice)",
  "Lead 7 (fifths)",
  "Lead 8 (bass + lead)",
  "Pad 1 (new age)",
  "Pad 2 (warm)",
  "Pad 3 (polysynth)",
  "Pad 4 (choir)",
  "Pad 5 (bowed)",
  "Pad 6 (metallic)",
  "Pad 7 (halo)",
  "Pad 8 (sweep)",
  "FX 1 (rain)",
  "FX 2 (soundtrack)",
  "FX 3 (crystal)",
  "FX 4 (atmosphere)",
  "FX 5 (brightness)",
  "FX 6 (goblins)",
  "FX 7 (echoes)",
  "FX 8 (sci-fi)",
  "Sitar",
  "Banjo",
  "Shamisen",
  "Koto",
  "Kalimba",
  "Bagpipe",
  "Fiddle",
  "Shanai",
  "Tinkle Bell",
  "Agogo",
  "Steel Drums",
  "Woodblock",
  "Taiko Drum",
  "Melodic Tom",
  "Synth Drum",
  "Reverse Cymbal",
  "Guitar Fret Noise",
  "Breath Noise",
  "Seashore",
  "Bird Tweet",
  "Telephone Ring",
  "Helicopter",
  "Applause",
  "Gunshot"
]

# The encoders and tools are expected in your PATH. You can supply alternate
# paths by changing the constants below.
OGGENC = `which oggenc`.chomp
LAME = `which lame`.chomp
FLUIDSYNTH = `which fluidsynth`.chomp
SOX = `which sox`.chomp

puts "Building the following instruments using font: " + SOUNDFONT

# Display instrument names.
INSTRUMENTS.each do |i|
  puts "    #{i}: " + MIDIJS_PATCH_NAMES[i]
end

puts
puts "Using OGG encoder: " + OGGENC
puts "Using MP3 encoder: " + LAME
puts "Using FluidSynth encoder: " + FLUIDSYNTH
puts "Using SOX encoder: " + SOX
puts
puts "Sending output to: " + BUILD_DIR
puts

raise "Can't find soundfont: #{SOUNDFONT}" unless File.exists? SOUNDFONT
raise "Can't find 'oggenc' command" if OGGENC.empty?
raise "Can't find 'lame' command" if LAME.empty?
raise "Can't find 'fluidsynth' command" if FLUIDSYNTH.empty?
raise "Output directory does not exist: #{BUILD_DIR}" unless File.exists?(BUILD_DIR)

puts "Hit return to begin."
$stdin.readline

NOTES = {
  "C"  => 0,
  "Db" => 1,
  "D"  => 2,
  "Eb" => 3,
  "E"  => 4,
  "F"  => 5,
  "Gb" => 6,
  "G"  => 7,
  "Ab" => 8,
  "A"  => 9,
  "Bb" => 10,
  "B"  => 11
}

MIDI_C0 = 12
VELOCITY = 85
DURATION = Integer(3000) # milliseconds
TEMP_FILE = "#{BUILD_DIR}/%s%stemp.midi"
FLUIDSYNTH_RAW = "%s.raw"

def note_to_int(note, octave)
  value = NOTES[note]
  increment = MIDI_C0 + (octave * 12)
  return value + increment
end

def int_to_note(value)
  raise "Bad Value" if value < MIDI_C0
  reverse_notes = NOTES.invert
  value -= MIDI_C0
  octave = value / 12
  note = value % 12
  return { key: reverse_notes[note],
           octave: octave }
end

# Run a quick table validation
MIDI_C0.upto(100) do |x|
  note = int_to_note x
  raise "Broken table" unless note_to_int(note[:key], note[:octave]) == x
end

def generate_midi(program, note_value, file)
  include MIDI
  seq = Sequence.new()
  track = Track.new(seq)

  seq.tracks << track
  track.events << ProgramChange.new(0, Integer(program))
  track.events << NoteOn.new(0, note_value, VELOCITY, 0) # channel, note, velocity, delta
  track.events << NoteOff.new(0, note_value, VELOCITY, DURATION)

  File.open(file, 'wb') { | file | seq.write(file) }
end

def run_command(cmd)
  puts "Running: " + cmd
  `#{cmd}`
end

def midi_to_audio(source, target)
  digest = Digest::SHA1.hexdigest source
  raw_file = FLUIDSYNTH_RAW % [digest]
  run_command "#{FLUIDSYNTH} -C 1 -R 1 -g 1. -F #{raw_file} #{SOUNDFONT} #{source}"
  run_command "#{SOX} --norm=-1 -b 16 -c 2 -e signed-integer -r 44100 #{raw_file} #{target} remix 1 fade 0 -0 .1"
  # run_command "#{OGGENC} -q 6 #{target}"
  run_command "#{LAME} --preset standard #{target}"
  rm target
end

def open_js_file(instrument_key, type)
  js_file = File.open("#{BUILD_DIR}/#{instrument_key}-#{type}.js", "w")
  js_file.write(
"""
if (typeof(MIDI) === 'undefined') var MIDI = {};
if (typeof(MIDI.Soundfont) === 'undefined') MIDI.Soundfont = {};
MIDI.Soundfont.#{instrument_key} = {
""")
  return js_file
end

def close_js_file(file)
  file.write("\n}\n")
  file.close
end

def base64js(note, file, type)
  output = '"' + note + '": '
  output += '"' + "data:audio/#{type};base64,"
  output += Base64.strict_encode64(File.read(file)) + '"'
  return output
end

def generate_audio(program)
  instrument = MIDIJS_PATCH_NAMES[program]
  program_key = instrument.downcase.gsub(/[^a-z0-9 ]/, "").gsub(/\s+/, "_")

  puts "Generating audio for: " + instrument + "(#{program_key})"

  mkdir_p "#{BUILD_DIR}/#{program_key}"
  # ogg_js_file = open_js_file(program_key, "ogg")
  # mp3_js_file = open_js_file(program_key, "mp3")

  note_to_int("A", 0).upto(note_to_int("C", 8)) do |note_value|
    note = int_to_note(note_value)
    # output_name = "#{note[:key]}#{note[:octave]}"
    output_name = "#{note_value}"
    output_path_prefix = BUILD_DIR + "/#{program_key}" + output_name

    puts "Generating: #{output_name}"
    temp_file_specific = TEMP_FILE % [output_name, program_key]
    generate_midi(program, note_value, temp_file_specific)
    midi_to_audio(temp_file_specific, output_path_prefix + ".wav")

    puts "Updating JS files..."
    # ogg_js_file.write(base64js(output_name, output_path_prefix + ".ogg", "ogg") + ",\n")
    # mp3_js_file.write(base64js(output_name, output_path_prefix + ".mp3", "mp3") + ",\n")

    mv output_path_prefix + ".mp3", "#{BUILD_DIR}/#{program_key}/#{output_name}.mp3"
    # rm output_path_prefix + ".ogg"
    rm temp_file_specific
    digest = Digest::SHA1.hexdigest temp_file_specific
    rm FLUIDSYNTH_RAW % [digest]
  end

  # close_js_file(ogg_js_file)
  # close_js_file(mp3_js_file)
end

Parallel.each(INSTRUMENTS, :in_processes=>10){|i| generate_audio(i)}
