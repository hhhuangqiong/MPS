import path from 'path';
import bpmn from 'bpmn';

export default class BpmnManager {
  constructor(mongoDbUrl, diagramFileName) {
    if (!mongoDbUrl) {
      throw new Error('mongoDbUrl is not defined');
    }

    if (!diagramFileName) {
      throw new Error('diagramFileName is not defined');
    }

    this.manager = this.createManager(mongoDbUrl, diagramFileName);
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

    manager.addBpmnFilePath(path.resolve(__dirname, `./${diagramFileName}.bpmn`));

    return manager;
  }

  startServer(port) {
    return new Promise(resolve => {
      const server = this.manager.createServer({
        logLevel: 'debug',
      });

      server.listen(port, () => {
        resolve(`Server is listening at ${server.name} at ${server.url}`);
      });
    });
  }

  createProcess(processId) {
    return new Promise((resolve, reject) => {
      if (!processId) {
        reject('processId is not defined');
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

  findAllProcesses() {
    return new Promise((resolve, reject) => {
      this.manager.getAllProcesses((error, processes) => {
        if (error) {
          reject(error);
          return;
        }

        if (!processes || !processes.length) {
          reject('processes is empty or undefined');
          return;
        }

        resolve(processes.map(currentProcess => currentProcess._implementation));
      });
    });
  }

  findByProperty(props = {}) {
    return new Promise((resolve, reject) => {
      if (typeof props !== 'object') {
        reject(new Error('props is undefined'));
        return;
      }

      this.manager.findByProperty(props, (error, processes) => {
        resolve(processes.map(currentProcess => currentProcess._implementation));
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
    if (!eventName || typeof triggerEventName !== 'string') {
      return Promise.reject(new Error('eventName is undefined'));
    }

    return this
      .getProcess(processId)
      .then(currentProcess => {
        currentProcess.setLogLevel(process.env.NODE_ENV === 'production' ? 'error' : 'debug');
        currentProcess.triggerEvent(eventName, data);

        return currentProcess;
      });
  }
}
