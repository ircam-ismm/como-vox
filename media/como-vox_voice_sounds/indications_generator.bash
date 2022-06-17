#!/bin/bash

# Double-click
cd "$(dirname "$0")" || exit 0

voice="aurelie"
rate=175 # words per minute

mkdir -p "$voice"

generate() {
  filename="${voice}/${1}.aiff"
  say -v "$voice" -r "$rate" -o "$filename" "$2"
}


generate "a_vous" "À vous."
generate "c_est_a_vous" "C'est à vous."
generate "annule" "Annulé."
generate "erreur" "Erreur."
generate "trop_lent" "Trop lent."
generate "trop_rapide" "Trop rapide."
generate "trop_tot" "Trop tôt."
generate "trop_tard" "Trop tard."
generate "trop_variable" "Trop variable."
generate "pas_assez_regulier" "Pas assez régulier."
generate "merci" "Merci."
generate "termine" "Terminé."
generate "c_est_fini" "C'est fini."
generate "c_est_bien" "C'est bien."
