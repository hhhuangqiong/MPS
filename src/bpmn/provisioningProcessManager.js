import path from 'path';

import _ from 'lodash';
import Joi from 'joi';
import { ProcessManager } from 'bpmn';
import Promise from 'bluebird';
import { check } from 'm800-util';

import { PROVISIONING_EVENT } from './../domain';
import { bpmnEvents, decorateBpmnTask, decorateBpmnHandler } from './handlers';

const BPMN_FILE_PATH = path.join(__dirname, 'provisioning.bpmn');

export function provisioningProcessManager(logger, mongoOptions, bpmnHandlers, eventBus) {
  check.ok('logger', logger);
  check.schema('mongoOptions', mongoOptions, Joi.object({
    uri: Joi.string().required(),
    server: Joi.object().required(),
  }));
  check.members('bpmnHandlers', bpmnHandlers, _.values(bpmnEvents));
  check.ok('eventBus', eventBus);

  const bpmn = new ProcessManager({
    persistencyOptions: {
      uri: mongoOptions.uri,
      logger: { trace: logger.debug.bind(logger) },
      // specifically overrides bpmn mongo persistency adapter auto_reconnect
      // config altho this is not a valid for mongodb:2.x. Just to ensure
      // it would auto reconnect if there's backward compatibility support
      server: mongoOptions.server,
    },
  });
  Promise.promisifyAll(bpmn);

  // Simple tasks which need to be bound to process instance
  const HANDLERS = [
    bpmnEvents.DEFAULT_EVENT_HANDLER,
    bpmnEvents.DEFAULT_ERROR_HANDLER,
    bpmnEvents.PROVISIONING_START,
    bpmnEvents.PROVISIONING_END,
  ];
  // Reducer-like business tasks
  const TASKS = _.difference(_.values(bpmnEvents), HANDLERS);

  const decoratedHandlers = _(bpmnHandlers)
    .pickBy((value, key) => HANDLERS.includes(key))
    .mapValues(handler => decorateBpmnHandler(handler, logger))
    .value();
  const decoratedTasks = _(bpmnHandlers)
    .pickBy((value, key) => TASKS.includes(key))
    .mapValues(handler => decorateBpmnTask(handler, logger))
    .value();

  const allHandlers = {
    ...decoratedHandlers,
    ...decoratedTasks,
  };
  bpmn.addBpmnFilePath(BPMN_FILE_PATH, allHandlers);

  async function run(params) {
    check.schema('params', params, Joi.object({
      processId: Joi.string().required(),
      provisioningId: Joi.string().required(),
      profile: Joi.object().required(),
      previousResults: Joi.object().allow(null).optional(),
    }));

    const process = await bpmn.createProcessAsync(params.processId);
    process.triggerEvent(bpmnEvents.PROVISIONING_START, params);
    return params.processId;
  }

  function createEventHandler(name, processor) {
    return function handle(event) {
      processor(event)
        .catch(err => {
          logger.error(`[BPMN] Failure when processing ${name}: ${err.message}.`);
        })
        .done();
    };
  }

  function start() {
    eventBus.on(
      PROVISIONING_EVENT.PROVISIONING_START_REQUESTED,
      createEventHandler(PROVISIONING_EVENT.PROVISIONING_START_REQUESTED, run)
    );
  }

  return {
    start,
  };
}

export default provisioningProcessManager;
