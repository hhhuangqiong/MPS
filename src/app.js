import { Bottle } from 'bottlejs';

import { register as registerInfrastructure } from './infrastructure';
import { register as registerServices } from './services';
import { register as registerBpmn } from './bpmn';
import { register as registerApi } from './api';
import { register as registerServer } from './server';

function registerExternalServiceOptions(registry, configPrefix, config) {
  registry.constant(`${configPrefix}ServiceOptions`, {
    baseUrl: config[configPrefix].baseUrl,
    serviceName: config[configPrefix].serviceName,
  });
  registry.factory(`${configPrefix}ClientOptions`, container => ({
    baseUrl: container[`${configPrefix}UriResolver`],
    timeout: config[configPrefix].timeout,
    proxyUrl: config.httpDebugProxyUrl,
  }));
}

export async function create(config) {
  const app = new Bottle();

  const ENV = process.env.NODE_ENV || 'development';
  const mongoOptions = config.mongodb;
  const serverOptions = {
    env: ENV,
    port: process.env.PORT || 3000,
  };

  // Configuration
  app.constant('ENV', ENV);
  [
    'cps',
    'iam',
    'boss',
    'maaiiRate',
    'signUpRule',
  ].forEach(prefix => registerExternalServiceOptions(app, prefix, config));
  app.constant('serviceDiscoveryOptions', config.cluster);
  app.constant('mongoOptions', mongoOptions);
  app.constant('mongoConnectionOptions', mongoOptions.connectionOptions);
  app.constant('mongoTemplateStorageOptions', config.bpmn.templates);
  app.constant('serverOptions', serverOptions);
  app.constant('bpmnConcurrencyOptions', { maxConcurrentRequests: config.bpmn.maxConcurrentRequests });

  registerInfrastructure(app);
  registerServices(app);
  registerBpmn(app);
  registerApi(app);
  registerServer(app);

  const { container } = app;
  const { mongooseConnectionFactory } = container;
  const mongooseConnection = await mongooseConnectionFactory.connect();
  app.constant('mongooseConnection', mongooseConnection);

  return app.container;
}

export default create;
