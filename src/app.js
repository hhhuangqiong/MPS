import { Bottle } from 'bottlejs';

import { register as registerInfrastructure } from './infrastructure';
import { register as registerServices } from './services';
import { register as registerBpmn } from './bpmn';
import { register as registerApi } from './api';
import { register as registerServer } from './server';

export function create(config) {
  const app = new Bottle();

  const ENV = process.env.NODE_ENV || 'development';
  const cpsOptions = config.cps;
  const cpsApiOptions = cpsOptions.api;
  const bossOptions = config.boss;
  const bossApiOptions = bossOptions.api;
  const iamOptions = config.iam;
  const iamApiOptions = iamOptions.api;
  const signUpRuleOptions = config.signUpRule;
  const signUpRuleApiOptions = signUpRuleOptions.api;
  const mongoOptions = config.mongodb;
  const serverOptions = {
    env: ENV,
    port: process.env.PORT || 3000,
  };

  // Configuration
  app.constant('cpsOptions', cpsOptions);
  app.constant('cpsApiOptions', {
    ...cpsApiOptions,
    proxyUrl: config.httpDebugProxyUrl,
  });
  app.constant('bossOptions', bossOptions);
  app.constant('bossApiOptions', {
    ...bossApiOptions,
    proxyUrl: config.httpDebugProxyUrl,
  });
  app.constant('iamOptions', iamOptions);
  app.constant('iamApiOptions', {
    ...iamApiOptions,
    proxyUrl: config.httpDebugProxyUrl,
  });
  app.constant('signUpRuleOptions', signUpRuleOptions);
  app.constant('signUpRuleApiOptions', {
    ...signUpRuleApiOptions,
    proxyUrl: config.httpDebugProxyUrl,
  });
  app.constant('mongoOptions', mongoOptions);
  app.constant('ENV', ENV);
  app.constant('serverOptions', serverOptions);
  app.constant('bpmnConcurrencyOptions', config.bpmn);

  registerInfrastructure(app);
  registerServices(app);
  registerBpmn(app);
  registerApi(app);
  registerServer(app);

  return app.container;
}

export default create;
