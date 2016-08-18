import _ from 'lodash';
_.mixin(require('lodash-deep'));

/**
 * Util to workaround issue supply array to nconf through env variables.
 * For JSON objects with keys are all parseable to integer, Convert it to an array
 */
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

_.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
// try compile any field values with params
export function compileJsonTemplate(obj, params) {
  return _.deepMapValues(obj, (value) => {
    if (!_.isString(value)) return value;
    const compiled = _.template(value);
    return compiled(params);
  });
}
