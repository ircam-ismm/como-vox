#!/bin/bash

voices=(
  audrey
  aurelie
  thomas
)

# double-click
cd "$( dirname "$0" )" || (echo "no dir: ${0}"; exit 1)

for voice in "${voices[@]}" ; do
  say -v "${voice}" "un, deux, trois, quatre, cinq, six, sept, huit, neuf, dix, onze, douze, treize, quatorze, quinze, seize." -o "compte_${voice}.aiff"
done
