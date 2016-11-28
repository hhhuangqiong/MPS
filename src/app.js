import { Bottle } from 'bottlejs';

import { register as registerInfrastructure } from './infrastructure';
import { register as registerServices } from './services';
import { register as registerBpmn } from './bpmn';
import { register as registerApi } from './api';
import { register as registerServer } from './server';

export function create(config) {
  const app = new Bottle();

  const ENV = process.env.NODE_ENV || 'development';
  const mongoOptions = config.mongodb;
  const serverOptions = {
    env: ENV,
    port: process.env.PORT || 3000,
  };

  // Configuration
  app.constant('cpsApiOptions', {
    ...config.cps,
    proxyUrl: config.httpDebugProxyUrl,
  });
  app.constant('bossApiOptions', {
    ...config.boss,
    proxyUrl: config.httpDebugProxyUrl,
  });
  app.constant('iamApiOptions', {
    ...config.iam,
    proxyUrl: config.httpDebugProxyUrl,
  });
  app.constant('maaiiRateOptions', {
    ...config.maaiiRate,
    proxyUrl: config.httpDebugProxyUrl,
  });
  app.constant('signUpRuleApiOptions', {
    ...config.signUpRule,
    proxyUrl: config.httpDebugProxyUrl,
  });
  app.constant('mongoOptions', mongoOptions);
  app.constant('mongoTemplateStorageOptions', config.bpmn.templates);
  app.constant('ENV', ENV);
  app.constant('serverOptions', serverOptions);
  app.constant('bpmnConcurrencyOptions', { maxConcurrentRequests: config.bpmn.maxConcurrentRequests });

  registerInfrastructure(app);
  registerServices(app);
  registerBpmn(app);
  registerApi(app);
  registerServer(app);

  return app.container;
}

export default create;
