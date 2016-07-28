import path from 'path';
import bpmn from 'bpmn';
import uuid from 'uuid';

import Provisioning from '../models/Provisioning';
import logger from '../initializer/logger';

import {
  ArgumentNullError,
  TypeError,
} from 'common-errors';

export default class BpmnManager {
  constructor(mongoDbUrl, diagramFileName, startEventName) {
    if (!mongoDbUrl) {
      throw new ArgumentNullError('mongoDbUrl');
    }

    if (!diagramFileName) {
      throw new ArgumentNullError('diagramFileName');
    }

    this.manager = this.createManager(mongoDbUrl, diagramFileName);
    this.startEventName = startEventName;
  }

  createManager(mongoDbUrl, diagramFileName) {
    const manager = new bpmn.ProcessManager({
      persistencyOptions: {
        uri: mongoDbUrl,
      },
    });

    if (!manager) {
      throw new Error('manager creation is fail');
    }

    const fullpath = path.resolve(__dirname, `./${diagramFileName}.bpmn`);
    manager.addBpmnFilePath(fullpath);

    return manager;
  }

  createProcess(processId) {
    return new Promise((resolve, reject) => {
      if (!processId) {
        reject(new ArgumentNullError('processId'));
        return;
      }

      this.manager.createProcess(processId, (err, currentProcess) => {
        if (err) {
          reject(err);
          return;
        }

        if (!currentProcess) {
          reject('Fail to create process');
          return;
        }

        resolve(currentProcess);
      });
    });
  }

  findByProperty(props = {}) {
    return new Promise((resolve, reject) => {
      if (typeof props !== 'object') {
        reject(new TypeError('props is undefined'));
        return;
      }

      this.manager.findByProperty(props, (error, processes) => {
        /* eslint-disable no-underscore-dangle */
        resolve(processes.map(currentProcess => currentProcess._implementation));
        /* eslint-enable */
      });
    });
  }

  getProcess(processId) {
    return new Promise((resolve, reject) => {
      this.manager.get(processId, (error, process) => {
        if (error) {
          reject(error);
          return;
        }

        if (!process) {
          reject(new Error(`Fail to get process by id ${processId}`));
          return;
        }

        resolve(process);
      });
    });
  }

  triggerEvent(processId, eventName, data = {}) {
    if (typeof eventName !== 'string' || !eventName.length) {
      return Promise.reject(new TypeError('eventName is not a string or it is empty'));
    }

    return this
      .getProcess(processId)
      .then(currentProcess => {
        // currentProcess.setLogLevel(process.env.NODE_ENV === 'production' ? 'error' : 'debug');
        currentProcess.triggerEvent(eventName, data);

        return currentProcess;
      });
  }

  async createRecord(params = {}) {
    try {
      const provisioningRecord = new Provisioning(params);
      return await provisioningRecord.save();
    } catch (e) {
      return e;
    }
  }

  async getProvisioningStatus(companyId) {
    try {
      return await Provisioning
        .findOne({ company_id: companyId })
        .sort({ created_at: -1 });
    } catch (e) {
      return e;
    }
  }

  async start(data = {}, retryTimes = 0) {
    try {
      logger(`Current retry attempt: ${retryTimes}`);

      // Creating a new process with a randomId
      const processId = uuid.v1();

      await this.createProcess(processId);
      const eventInstance = await this.triggerEvent(processId, this.eventName, data);

      const processFail = !eventInstance.views.endEvent;
      const shouldRetry = retryTimes < (process.env.NUMEBR_OF_RETRY || 0);

      if (shouldRetry && processFail) {
        return await this.start(data, retryTimes + 1);
      }

      return eventInstance;
    } catch (e) {
      return e;
    }
  }
}
