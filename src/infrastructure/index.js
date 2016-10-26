import { createMongooseConnection } from './mongo';
import { createLogger } from './logger';
import { createEventBus } from './eventBus';

export * from './logger';
export * from './mongo';
export * from './eventBus';

export function register(container) {
  container.service('logger', createLogger, 'ENV');
  container.service('eventBus', createEventBus);
  container.service('mongooseConnection', createMongooseConnection, 'logger', 'mongoOptions');
  return container;
}

export default register;
