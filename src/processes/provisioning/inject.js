import uuid from 'uuid';
import path from 'path';
import _ from 'lodash';

import ioc from '../../ioc';

const { logger } = ioc.container;

const PROCESS_PATH = path.resolve(__dirname, './provisioning.bpmn');

/**
 * Helper module to integrate with processManager
 */
export default function injectProvisioningProcoess(processManager, onProvisioningComplete) {
  const processHandlers = require('./handlers');

  processManager.addBpmnFilePath(
    PROCESS_PATH,
    _.extend({
      PROVISIONING_START({ provisionId, profile, taskResults = {} }, done) {
        logger.info('provisioing start');

        this.setProperty('provisionId', provisionId);
        this.setProperty('taskResults', taskResults);

        done(profile);
      },
      PROVISIONING_END(data, done) {
        logger.info('provisioing end');

        const taskResults = this.getProperty('taskResults');
        const errors = this.getProperty('errors');
        const provisionId = this.getProperty('provisionId');
        onProvisioningComplete(provisionId, {
          errors,
          taskResults,
        });
        done(data);
      },
    }, processHandlers)
  );

  /**
   * Loop through all tasks to validate on input profile, if interface of validateProfile
   * has been impl.
   * @param  {Object} profile   Provisioning Profile
   * @param  {Object} taskResults Container of in service attributes, empty if first time process runs
   * @return {boolean}           True is validate successfully
   * @throws {ValidationError}   Validation error on specific field of profile
   */
  function validateProfile(profile, taskResults) {
    _.forEach(processHandlers, (value) => {
      value.validateProfile && value.validateProfile(profile, taskResults);
    });
    return true;
  }

  function generateProcessId() {
    return uuid.v4();
  }

  /**
   * Trigger process start using process manager
   */
  async function startProcess(provisioningId, profile, taskResults = {}) {
    validateProfile(profile, taskResults);

    const processId = generateProcessId();
    const process = await processManager.createProcess(processId);

    process.triggerEvent('PROVISIONING_START', { profile, provisioningId, taskResults });

    return processId;
  }

  return {
    startProcess,
    validateProfile,
  };
}
