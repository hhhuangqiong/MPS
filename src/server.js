import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import metricsMiddleware from 'm800-prometheus-express';
import healthCheck from 'm800-health-check';
import { check } from 'm800-util';

export function createServer(logger, api, mongooseConnection, serverOptions) {
  check.ok('logger', logger);
  check.ok('api', api);
  check.ok('mongooseConnection', mongooseConnection);
  check.members('serverOptions', serverOptions, ['env', 'port']);

  const server = express();
  server.use(metricsMiddleware());
  server.use(morgan('common'));
  server.use(bodyParser.json());

  function start() {
    healthCheck(server, {
      mongodb: {
        mongoose: mongooseConnection,
      },
    });

    server.use(api);
    server.listen(serverOptions.port);
    logger.debug(`Server is listening at port ${serverOptions.port}...`);
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
