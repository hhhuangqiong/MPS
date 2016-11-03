import { DEFAULT_ERROR_HANDLER } from '../bpmnEvents';

export function createDefaultErrorHandler() {
  function defaultErrorHandler(error, context) {
    const { logger } = context;
    logger.info('Error caught within task ', error.stack);
  }

  defaultErrorHandler.$meta = {
    name: DEFAULT_ERROR_HANDLER,
  };

  return defaultErrorHandler;
}

export default createDefaultErrorHandler;
