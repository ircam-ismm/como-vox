const e = {}

/**
 * Returns a date suitable for a file name.
 *
 * @returns {String} date as YYYYMMDD_hhmmss
 */
export function date() {
  const date = new Date();

  const year = date.getFullYear();
  const month = pad('00', date.getMonth() + 1); // Month starts at 0
  const day = pad('00', date.getDate());

  const hours = pad('00', date.getHours());
  const minutes = pad('00', date.getMinutes());
  const seconds = pad('00', date.getSeconds());
  const milliseconds = pad('000', date.getMilliseconds());

  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}
Object.assign(e, {date});

/**
 * Pad a string with a prefix.
 *
 * @param {String} prefix
 * @param {String} radical
 * @returns {String} concatenation of prefix + radical, sliced to the minimum of
 *                   the prefix or radical size.
 */
export function pad(prefix, radical) {
  const string = (typeof radical === 'string'
                  ? radical
                  : radical.toString() );

  const slice = (string.length > prefix.length
                  ? prefix.length
                  : -prefix.length);
  return (prefix + string).slice(slice);
}
Object.assign(e, {pad});


export default e;
