const LEADING_DOT_REGEX = /^\./;
// eslint-disable-next-line
const PROP_NAME_REGEX = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
const ESCAPE_CHAR_REGEX = /\\(\\)?/g;

/**
 * @desc Parses a property path to an array of property names and array indexes
 * Taken from https://github.com/lodash/lodash/blob/4.16.6/lodash.js#L6710
 * @example stringToPath('items[0].name') -> ['items', '0', 'name']
 * @param input
 * @returns {Array}
 */
export function stringToPath(input) {
  const result = [];
  if (LEADING_DOT_REGEX.test(input)) {
    result.push('');
  }
  input.replace(PROP_NAME_REGEX, (match, number, quote, string) => {
    result.push(quote ? string.replace(ESCAPE_CHAR_REGEX, '$1') : (number || match));
  });
  return result;
}

export default stringToPath;
