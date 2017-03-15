import { mongooseConnectionFactory } from './mongo';
import { createLogger } from './logger';
import { createEventBus } from './eventBus';
import {
  createServiceDiscoveryAgent,
  createMongoUriResolver,
  createApiUriResolver,
} from './serviceDiscovery';

export * from './logger';
export * from './mongo';
export * from './eventBus';
export * from './serviceDiscovery';

function registerApiUriResolver(registry, configPrefix, friendlyName) {
  registry.factory(`${configPrefix}UriResolver`, (container) => {
    const options = container[`${configPrefix}ServiceOptions`];
    const { serviceDiscoveryAgent, logger } = container;
    return createApiUriResolver(
      serviceDiscoveryAgent.lookup,
      logger,
      {
        serviceName: options.serviceName,
        friendlyServiceName: friendlyName,
        fallbackUri: options.baseUrl,
      }
    );
  });
}

export function register(registry) {
  registry.service('logger', createLogger, 'ENV');
  registry.service('eventBus', createEventBus);
  registry.service('serviceDiscoveryAgent', createServiceDiscoveryAgent, 'logger', 'serviceDiscoveryOptions');
  registry.factory('mongoUriResolver', ({ serviceDiscoveryAgent, logger, mongoOptions }) =>
    createMongoUriResolver(
      serviceDiscoveryAgent.lookup,
      logger,
      {
        serviceName: mongoOptions.serviceName,
        fallbackUri: mongoOptions.uri,
        uriOptions: {
          database: mongoOptions.database,
        },
      }
    )
  );
  registry.service(
    'mongooseConnectionFactory',
    mongooseConnectionFactory,
    'logger',
    'mongoUriResolver',
    'mongoOptions',
  );
  registerApiUriResolver(registry, 'cps', 'CPS');
  registerApiUriResolver(registry, 'iam', 'IAM');
  registerApiUriResolver(registry, 'maaiiRate', 'Rates Service');
  registerApiUriResolver(registry, 'boss', 'BOSS');
  registerApiUriResolver(registry, 'signUpRule', 'Sign Up Rule Service');
  return registry;
}

export default register;
