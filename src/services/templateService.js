import { NotFoundError } from 'common-errors';
import _ from 'lodash';
import _deep from 'lodash-deep';
_.mixin(_deep);

import { check } from './../util';

export function compileObjectTemplate(template) {
  check.predicate('template', template, _.isPlainObject, 'Template should be a plain object');
  // Use {{variable}} syntax for template variables
  const INTERPOLATION_REGEX = /{{([\s\S]+?)}}/g;

  function render(params) {
    return _.deepMapValues(template, (value) => {
      if (!_.isString(value)) return value;
      const compiled = _.template(value, { interpolate: INTERPOLATION_REGEX });
      return compiled(params);
    });
  }
  return render;
}

export function templateService(keyValueStorage) {
  check.ok('keyValueStorage', keyValueStorage);

  async function get(key) {
    const template = await keyValueStorage.get(key);
    if (!template) {
      throw new NotFoundError(`template:${key}`);
    }
    return template;
  }

  async function render(key, data = {}) {
    check.predicate('key', key, _.isString, 'Key should be a string');

    const template = await keyValueStorage.get(key);
    if (!template) {
      throw new NotFoundError(`template:${key}`);
    }
    const renderer = compileObjectTemplate(template);
    return renderer(data);
  }

  return {
    get,
    render,
  };
}

export default templateService;
