import _ from 'lodash';

export function getPossibleFieldNames(columnName) {
  return [
    columnName.toLowerCase(),
    _.lowerCase(columnName),
    _.snakeCase(columnName),
  ];
}

export function trimValue(value) {
  return _.isString(value) ? _.trim(value) : value;
}

export function getValue(obj, columnName) {
  const rawValue = _.find(obj, (value, key) => {
    const possibleNames = getPossibleFieldNames(columnName);
    return _.some(possibleNames, name => name === _.trim(key).toLowerCase());
  });
  return trimValue(rawValue);
}

export function normalizeFieldNames(obj, columnNames) {
  return _(columnNames)
    .map(columnName => [columnName, getValue(obj, columnName)])
    .filter(([, value]) => !_.isUndefined(value))
    .fromPairs()
    .value();
}
