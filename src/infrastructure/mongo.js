import Joi from 'joi';
import Promise from 'bluebird';
import mongoose from 'mongoose';
import { check } from 'm800-util';

// Use bluebird promises instead of mpromise
mongoose.Promise = Promise;

export function createMongooseConnection(logger, mongoOptions) {
  check.schema('mongoOptions', mongoOptions, Joi.object({
    uri: Joi.string().required(),
    server: Joi.object().required(),
    debug: Joi.boolean().required(),
  }));
  const { uri, server, debug } = mongoOptions;

  // to support multiple connections
  const connection = mongoose.createConnection(uri, { server });

  mongoose.set('debug', debug);

  ['open', 'connecting', 'connected', 'reconnected', 'disconnected', 'close', 'fullsetup'].forEach(evt => {
    connection.on(evt, () => {
      logger.info(`Mongoose connection is ${evt}.`);
    });
  });

  connection.on('error', error => {
    logger.error(`Error connecting to MongoDB [${uri}]: ${error.message}`, error);
  });

  // monitor the replicaset
  if (connection.db.serverConfig.s.replset) {
    ['joined', 'left'].forEach(evt => {
      connection.db.serverConfig.s.replset.on(evt, (type, serverObj) => {
        logger.info(`Replset event: ${type} ${evt}`, serverObj.ismaster);
      });
    });

    connection.db.serverConfig.s.replset.on('error', error => {
      logger.error(`Replset error: ${error.message}`, error);
    });
  }

  return Promise.promisifyAll(connection);
}
