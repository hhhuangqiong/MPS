import _ from 'lodash';

export function parseObjectArrays(obj) {
  if (_.isArray(obj)) {
    return obj.map(parseObjectArrays);
  }
  if (!_.isObject(obj)) {
    return obj;
  }
  const numericKeys = _.keys(obj).map(_.parseInt);
  if (!_.every(numericKeys, _.isInteger)) {
    return _.mapValues(obj, parseObjectArrays);
  }
  const arr = [];
  _.each(obj, (value, key) => {
    arr[_.parseInt(key)] = parseObjectArrays(value);
  });
  return arr;
}
