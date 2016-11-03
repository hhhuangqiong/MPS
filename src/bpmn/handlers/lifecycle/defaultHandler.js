import { DEFAULT_EVENT_HANDLER } from '../bpmnEvents';

export function createDefaultHandler() {
  function handleEvent(eventType, currentFlowObjectName, handlerName, reason, context) {
    const { logger } = context;
    logger.info(`Handler not found for event ${currentFlowObjectName}:${handlerName}<${eventType}>. Reason: ${reason}`);
    return {};
  }

  handleEvent.$meta = {
    name: DEFAULT_EVENT_HANDLER,
  };

  return handleEvent;
}

export default createDefaultHandler;
