#!/bin/bash

input_base_path='export'
input_file_extension='.wav'

output_base_path='mp3'
output_file_extension='.mp3'

# double-click
cd "$( dirname "$0" )" || (echo "no dir: ${0}"; exit 1)

for input_file in "${input_base_path}"/*"${input_file_extension}" ; do
  input_file_name="$(basename "$input_file")"
  speaker="${input_file_name%_*}"
  count="$(echo "$input_file_name" \
           | sed "s/.*_\(.*\)${input_file_extension}/\1/" \
           | sed "s/^[0]*//g")"
  output_path="$(echo "${output_base_path}/${speaker}" \
                 | tr '[:upper:]' '[:lower:]')"
  output_file_name="${count}${output_file_extension}"
  output_file="${output_path}/${output_file_name}"

  echo "${input_file} => ${output_file}"
  mkdir -p "${output_path}"
  lame --preset standard "${input_file}" "${output_file}"
done
