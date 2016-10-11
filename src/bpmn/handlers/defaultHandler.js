import { getProperty } from './util';

export function createDefaultHandler(logger) {
  return function defaultEventHandler(eventType, currentFlowObjectName, handlerName, reason, done) {
    const ownerId = getProperty(this, 'ownerId');
    logger.info(`[${ownerId}] Handler not found for event ${currentFlowObjectName}:${handlerName}<${eventType}>`);
    // Called, if no handler could be invoked.
    done({});
  };
}

export default createDefaultHandler;
