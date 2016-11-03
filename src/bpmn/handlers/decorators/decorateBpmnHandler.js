import _ from 'lodash';
import { Logger } from 'winston';
import Promise from 'bluebird';
import Joi from 'joi';
import serializeError from 'serialize-error';

import { check } from './../../../util';
import { createStore } from './../common';

export function decorateBpmnHandler(handler, logger) {
  check.predicate('handler', handler, _.isFunction);
  check.schema('handler.$meta', handler.$meta, Joi.object({
    name: Joi.string().min(1).required(),
  }));
  check.ok('logger', logger);

  function serializeSystemErrorForStorage(error, trace) {
    const serialized = {
      ...serializeError(error),
      ...trace,
    };
    return serialized;
  }

  const handlerMeta = handler.$meta;

  function handleEvent(...args) {
    const inputArgs = _.dropRight(args, 1);
    const done = _.last(args);

    const processId = this.getProcessId();
    const traceId = `${handlerMeta.name}:${processId}`;
    const store = createStore(this);

    const context = {
      trace: {
        eventName: handlerMeta.name,
        processId,
        traceId,
      },
    };

    function rewriteLogMeta(level, msg, meta) {
      return _.extend({}, meta, context.trace);
    }

    function rewriteLogMessage(level, msg) {
      return `BPMN [${context.trace.traceId}] ${msg}`;
    }

    context.logger = new Logger({
      transports: _.values(logger.transports),
      levels: logger.levels,
      filters: logger.filters.concat([rewriteLogMessage]),
      rewriters: logger.rewriters.concat([rewriteLogMeta]),
    });
    context.logger.info('Starting event handler...');
    return Promise.try(() => handler.apply(this, [...inputArgs, context]))
      .then(result => {
        context.logger.info('Handler finished successfully.');
        return result;
      })
      .catch(err => {
        context.logger.error(`Handler failured. ${err.message}\n${err.stack}`, err);
        // Persist error
        const error = serializeSystemErrorForStorage(err, context.trace);
        let state = store.get();
        state = {
          ...state,
          system: {
            ...state.system,
            errors: state.system.errors.concat([error]),
          },
        };
        store.set(state);
        // Use previous input for next event
        return inputArgs[0];
      })
      .then(done)
      .done();
  }

  handleEvent.$meta = handler.$meta;

  return handleEvent;
}
