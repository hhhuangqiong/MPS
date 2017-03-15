import logger from 'winston';
import Promise from 'bluebird';

import config from './../../src/config';
import { mongooseConnectionFactory } from '../../src/infrastructure';

export async function createTestContext() {
  const mongoOptions = config.mongodb;
  const connectionFactory = mongooseConnectionFactory(
    logger,
    () => Promise.resolve(mongoOptions.uri)
  );
  const connection = await connectionFactory.connect();
  await connection.db.dropDatabase();
  return {
    connection,
    logger,
  };
}
