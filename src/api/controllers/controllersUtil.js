import _ from 'lodash';

export function decorateControllerMethod(method) {
  return async function rethrowError(req, res, next) {
    try {
      await method(req, res, next);
    } catch (e) {
      next(e);
    }
  };
}

export function decorateController(controller) {
  return _.mapValues(controller, decorateControllerMethod);
}

export default {
  decorateControllerMethod,
  decorateController,
};
