#!/bin/bash

# Double-click
cd "$(dirname "$0")"

src_ext=".wav"

mkdir -p "mp3"

for src in export/*${src_ext} ; do
    dst="mp3"/$(basename "$src")
    dst="${dst/.wav/.mp3}"
    lame --preset standard "$src" "$dst"
done
