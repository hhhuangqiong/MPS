import { Bottle } from 'bottlejs';

import { register as registerInfrastructure } from './infrastructure';
import { register as registerServices } from './services';
import { register as registerBpmn } from './bpmn';
import { register as registerApi } from './api';
import { register as registerServer } from './server';

export function create(config) {
  const app = new Bottle();

  const cpsOptions = config.cps;
  const cpsApiOptions = cpsOptions.api;
  const bossOptions = config.boss;
  const bossApiOptions = bossOptions.api;
  const iamOptions = config.iam;
  const iamApiOptions = iamOptions.api;
  const mumsOptions = config.mums;
  const mumsApiOptions = mumsOptions.api;
  const mongoOptions = config.mongodb;
  const serverOptions = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
  };

  // Configuration
  app.constant('cpsOptions', cpsOptions);
  app.constant('cpsApiOptions', cpsApiOptions);
  app.constant('bossOptions', bossOptions);
  app.constant('bossApiOptions', bossApiOptions);
  app.constant('iamOptions', iamOptions);
  app.constant('iamApiOptions', iamApiOptions);
  app.constant('mumsOptions', mumsOptions);
  app.constant('mumsApiOptions', mumsApiOptions);
  app.constant('mongoOptions', mongoOptions);
  app.constant('ENV', serverOptions.env);
  app.constant('serverOptions', serverOptions);

  registerInfrastructure(app);
  registerServices(app);
  registerBpmn(app);
  registerApi(app);
  registerServer(app);

  return app.container;
}

export default create;
