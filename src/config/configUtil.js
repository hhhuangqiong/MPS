import _ from 'lodash';
import _deep from 'lodash-deep';

_.mixin(_deep);

export function parseObjectArrays(object) {
  // just loop through children if it's array
  if (_.isArray(object)) {
    return _.map(object, parseObjectArrays);
  }

  if (!_.isPlainObject(object)) {
    return object;
  }

  const keys = Object.keys(object);

  // loop through children
  const parsed = _.reduce(object, (result, value, key) => {
    result[key] = parseObjectArrays(value);
    return result;
  }, {});

  if (_.every(keys, key => _.isInteger(_.parseInt(key)))) {
    // all keys are integer
    return _.toArray(parsed);
  }

  return parsed;
}
