import { getProperty } from './util';

export function createTaskStartHandler(logger) {
  return function onBeginHandler(currentFlowObjectName, data, done) {
    const ownerId = getProperty(this, 'ownerId');
    logger.info(`[${ownerId}] Task ${currentFlowObjectName} begins`);
    done(data);
  };
}

export default createTaskStartHandler;

