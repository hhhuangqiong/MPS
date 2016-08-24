import { ProcessManager } from 'bpmn';
import Promise from 'bluebird';

/* eslint-disable */
export default function init(mongoDbUri) {
/* eslint-enable */
  const processManager = new ProcessManager({
    persistencyOptions: {
      // temporary switching to file base persistency:
      uri: 'persist/',
    },
  });

  // promisifyAll
  Promise.promisifyAll(processManager);

  return processManager;
}
