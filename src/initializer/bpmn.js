import { ProcessManager } from 'bpmn';
import Promise from 'bluebird';
import logger from '../utils/logger';

/* eslint-disable */
export default function init(mongoDbUri, mongoDbServerOpts) {
/* eslint-enable */
  const processManager = new ProcessManager({
    persistencyOptions: {
      uri: mongoDbUri,
      logger: {
        trace: logger.debug.bind(logger),
      },
      // specifically overrides bpmn mongo persistency adapter auto_reconnect
      // config altho this is not a valid for mongodb:2.x. Just to ensure
      // it would auto reconnect if there's backward compatibility support
      server: mongoDbServerOpts,
    },
  });

  // promisifyAll
  Promise.promisifyAll(processManager);

  return processManager;
}
