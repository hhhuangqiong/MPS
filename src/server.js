import http from 'http';

import express from 'express';
import bodyParser from 'body-parser';
import Promise from 'bluebird';
import morgan from 'morgan';
import metricsMiddleware from 'm800-prometheus-express';
import healthCheck from 'm800-health-check';
import { check } from 'm800-util';

export function createServer(logger, api, mongooseConnection, serverOptions) {
  check.ok('logger', logger);
  check.ok('api', api);
  check.ok('mongooseConnection', mongooseConnection);
  check.members('serverOptions', serverOptions, ['env', 'port']);

  const app = express();
  app.use(metricsMiddleware());
  app.use(morgan('common'));
  app.use(bodyParser.json());

  async function start() {
    healthCheck(app, {
      mongodb: {
        mongoose: mongooseConnection,
      },
    });
    app.use(api);

    const server = Promise.promisifyAll(http.createServer(app));
    await server.listenAsync(serverOptions.port);
    logger.debug(`Server is listening at port ${serverOptions.port}...`);
    return server;
  }

  return {
    start,
  };
}

export function register(container) {
  container.service('server', createServer, 'logger', 'api', 'mongooseConnection', 'serverOptions');
  return container;
}

export default register;
