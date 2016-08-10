import { ProcessManager } from 'bpmn';
import Promise from 'bluebird';

export default function init(mongoDbUri) {
  const processManager = new ProcessManager({
    persistencyOptions: {
      uri: mongoDbUri,
    },
  });

  // promisifyAll
  Promise.promisifyAll(processManager);

  return processManager;
}
