// In order to support async/await
import 'babel-polyfill';

import path from 'path';
import bpmn from 'bpmn';
import uuid from 'uuid';

import Provisioning from '../models/Provisioning';

import {
  ArgumentNullError,
  TypeError,
  NotFoundError,
  NotPermittedError,
} from 'common-errors';

const COMPLETE_STATUS = 'COMPLETE';

export default class ProvisioningManager {
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
          reject(new NotFoundError(`Fail to get process by id ${processId}`));
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

  getServiceProfile(companyId) {
    return Provisioning
      .findOne({ company_id: companyId })
      .then(doc => {
        if (!doc) {
          throw new NotFoundError('company_id');
        }

        if (doc.getStatus() !== COMPLETE_STATUS) {
          throw new NotPermittedError('Provisioning is not completed');
        }

        return {
          company_code: doc.company_code,
          carrier_id: doc.getCarrierId(),
          capabilities: doc.capabilities,
          service_type: doc.service_type,
          payment_mode: doc.payment_mode,
        };
      });
  }

  createRecord(params = {}) {
    return new Provisioning(params).save();
  }

  getRecord(provisionId) {
    return Provisioning.findOne({ _id: provisionId });
  }

  getProvisioningStatusByCompanyIds(companyIds) {
    return Promise.all(companyIds.map(companyId => this.getProvisioningStatus(companyId)));
  }

  async getProvisioningStatus(companyId) {
    try {
      const doc = await Provisioning
        .findOne({ company_id: companyId })
        .sort({ created_at: -1 });

      return doc.getStatus();
    } catch (e) {
      return e;
    }
  }

  async start(data = {}) {
    if (!data.model) {
      throw new ArgumentNullError('model');
    }

    // Creating a new process with a randomId
    const processId = uuid.v1();

    await this.createProcess(processId);
    return await this.triggerEvent(processId, this.startEventName, data);
  }
}
