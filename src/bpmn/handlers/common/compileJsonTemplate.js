import _ from 'lodash';
import _deep from 'lodash-deep';
_.mixin(_deep);

// TODO: avoid global modifications like that!
_.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
// try compile any field values with params
export function compileJsonTemplate(obj, params) {
  return _.deepMapValues(obj, (value) => {
    if (!_.isString(value)) return value;
    const compiled = _.template(value);
    return compiled(params);
  });
}

export default compileJsonTemplate;
