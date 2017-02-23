import 'source-map-support/register';
import Promise from 'bluebird';
import packageJson from './../package.json';

import { create } from './app';
import { createLogger } from './infrastructure';
import config from './config';

async function run() {
  const logger = createLogger(process.env.NODE_ENV || 'development');
  try {
    const app = await create(config);
    const {
      ENV,
      server,
      ProvisioningProcessManager: bpmn,
      serviceDiscoveryAgent: discovery,
    } = app;

    const [httpServer] = await Promise.all([
      server.start(),
      discovery.connect(),
      bpmn.start(),
    ]);
    if (ENV !== 'development') {
      await discovery.registry.registerHttpServer(httpServer, {
        name: config.cluster.name,
        version: packageJson.version,
        sequentialId: config.cluster.sequentialId,
      });
    }
  } catch (e) {
    logger.error('Failed to start the service: %s', e.message, e);
    process.exit(1);
  }
}

run();
