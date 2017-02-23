import path from 'path';

import _ from 'lodash';
import Joi from 'joi';
import { ProcessManager } from 'bpmn';
import Promise from 'bluebird';
import { check } from 'm800-util';

import { PROVISIONING_EVENT } from './../domain';
import { bpmnEvents, decorateBpmnTask, decorateBpmnHandler } from './handlers';

const BPMN_FILE_PATH = path.join(__dirname, 'provisioning.bpmn');

export function provisioningProcessManager(logger, mongoUriResolver, mongoConnectionOptions, bpmnHandlers, eventBus) {
  check.ok('logger', logger);
  check.predicate('mongoUriResolver', mongoUriResolver, _.isFunction);
  check.members('bpmnHandlers', bpmnHandlers, _.values(bpmnEvents));
  check.ok('eventBus', eventBus);

  let bpmn;

  async function connect() {
    const mongoUri = await mongoUriResolver();
    bpmn = new ProcessManager({
      persistencyOptions: {
        uri: mongoUri,
        logger: { trace: logger.debug.bind(logger) },
        ...mongoConnectionOptions,
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

    // handler for the persist data
    function doneSavingHandler(error) {
      if (!error) {
        return;
      }
      const processId = this.getProcessId();
      logger.error(`[BPMN] Failure when persisting data with process id ${processId}`);

      // since it fails to save when duplicate key `processId`, retry to persist data again.
      // it will persist the current state into storage.
      if (error.code === 11000) {
        logger.warning(`[BPMN] Retry to persist data with process id ${processId}`);
        // get the current process and persist again
        const process = this._getImplementation();
        process.persist();
      }
    }

    const allHandlers = {
      ...decoratedHandlers,
      ...decoratedTasks,
      doneSavingHandler,
    };
    bpmn.addBpmnFilePath(BPMN_FILE_PATH, allHandlers);
    return bpmn;
  }

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

  async function start() {
    await connect();
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
