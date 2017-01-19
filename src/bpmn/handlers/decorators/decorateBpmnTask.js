import _ from 'lodash';
import Joi from 'joi';
import Promise from 'bluebird';
import { check } from 'm800-util';

import { createStore, IncompleteResultError, PUBLIC_STATE_SCHEMA } from './../common';
import { decorateBpmnHandler } from './decorateBpmnHandler';

export function decorateBpmnTask(handler, rootLogger) {
  check.predicate('handler', handler, _.isFunction);
  check.schema('handler.$meta', handler.$meta, Joi.object({
    name: Joi.string().min(1).required(),
  }));
  check.ok('rootLogger', rootLogger);

  function serializeSystemErrorForUser(error, trace) {
    const { traceId, eventName } = trace;
    return {
      message: `System error occurred. Contact support with the following trace id: ${traceId}.`,
      name: 'SystemError',
      code: 'SYSTEM_ERROR',
      traceId,
      eventName,
    };
  }

  async function handleEvent(input, context) {
    const { logger, trace } = context;
    const store = createStore(this);

    let state = store.get();
    // Stop entire process as soon as at least 1 error encountered
    const errorsCount = state.system.errors.length + state.public.errors.length;
    if (errorsCount > 0) {
      logger.warning(`Skipped handler because of ${errorsCount} error(s) in previous tasks.`);
      return input;
    }

    function handleSuccess(updates) {
      state = store.get();
      let currentPublicState = state.public;
      if (!updates) {
        return;
      }
      if (updates.results) {
        currentPublicState = {
          ...currentPublicState,
          results: {
            ...currentPublicState.results,
            ...updates.results,
          },
        };
      }
      if (updates.errors && updates.errors.length > 0) {
        currentPublicState = {
          ...currentPublicState,
          errors: currentPublicState.errors.concat(updates.errors),
        };
      }
      check.schema('currentPublicState', currentPublicState, PUBLIC_STATE_SCHEMA);
      state = store.set({
        ...state,
        public: currentPublicState,
      });
    }

    function handleSystemError(e) {
      const systemErrorForUser = serializeSystemErrorForUser(e, trace);
      state = store.get();
      state = store.set({
        ...state,
        public: {
          ...state.public,
          errors: state.public.errors.concat([systemErrorForUser]),
        },
      });
    }

    try {
      const currentPublicState = await Promise.try(() => handler(state.public, input, context));
      handleSuccess(currentPublicState);
      return input;
    } catch (e) {
      // Throwing an error in a task handler will mean system error
      let rethrownError = e;
      if (e instanceof IncompleteResultError) {
        handleSuccess(e.updates);
        handleSystemError(e.inner_error);
        rethrownError = e.inner_error;
      } else {
        handleSystemError(e, context);
      }
      throw rethrownError;
    }
  }

  handleEvent.$meta = handler.$meta;

  return decorateBpmnHandler(handleEvent, rootLogger);
}

export default decorateBpmnTask;
