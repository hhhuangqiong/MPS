import path from 'path';

import Joi from 'joi';
import { ProcessManager } from 'bpmn';
import Promise from 'bluebird';

import { check } from './../util';
import { PROVISIONING_EVENT } from './../domain';
import * as BPMN_EVENTS from './bpmnEvents';

const BPMN_FILE_PATH = path.join(__dirname, 'provisioning.bpmn');

export function provisioningProcessManager(logger, mongoOptions, bpmnHandlers, eventBus) {
  check.ok('logger', logger);
  check.schema('mongoOptions', mongoOptions, Joi.object({
    uri: Joi.string().required(),
    server: Joi.object().required(),
  }));
  check.members('bpmnHandlers', bpmnHandlers, BPMN_EVENTS);
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
  bpmn.addBpmnFilePath(BPMN_FILE_PATH, bpmnHandlers);

  async function run(params) {
    check.schema('params', params, Joi.object({
      processId: Joi.string().required(),
      provisioningId: Joi.string().required(),
      profile: Joi.object().required(),
      previousResult: Joi.object().allow(null).optional(),
    }));

    const process = await bpmn.createProcessAsync(params.processId);
    process.setProperty('ownerId', params.provisioningId);
    process.setProperty('taskResults', params.previousResult);
    process.triggerEvent(BPMN_EVENTS.PROVISIONING_START, params.profile);
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
