import logger from 'winston';
import Promise from 'bluebird';

import config from '../src/config';
import { createMongooseConnection as createConnection } from '../src/infrastructure/mongo';

export function createTestContext() {
  return new Promise((resolve, reject) => {
    // @TODO in future to support parallel tests, it may need to connect to different databases
    const mongoOptions = config.mongodb;
    const connection = createConnection(logger, mongoOptions);
    connection.once('connected', () => {
      // make sure the database is clean at the beginning
      connection.db.dropDatabase();
      resolve({ connection, logger });
    });
    connection.once('error', reject);
  });
}
