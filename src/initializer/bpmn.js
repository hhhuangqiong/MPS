import { ProcessManager } from 'bpmn';
import Promise from 'bluebird';

/* eslint-disable */
export default function init(mongoDbUri) {
/* eslint-enable */
  const processManager = new ProcessManager({
    persistencyOptions: {
      uri: mongoDbUri,
    },
  });

  // promisifyAll
  Promise.promisifyAll(processManager);

  return processManager;
}
