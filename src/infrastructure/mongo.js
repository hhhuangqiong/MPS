import Joi from 'joi';
import Promise from 'bluebird';
import mongoose from 'mongoose';
// Use bluebird promises instead of mpromise
mongoose.Promise = Promise;

import { check } from './../util';

export function createMongooseConnection(logger, mongoOptions) {
  check.schema('mongoOptions', mongoOptions, Joi.object({
    uri: Joi.string().required(),
    server: Joi.object().required(),
    debug: Joi.boolean().required(),
  }));
  const { uri, server, debug } = mongoOptions;

  const connection = mongoose.connect(uri, { server });

  mongoose.set('debug', debug);

  ['open', 'connecting', 'connected', 'reconnected', 'disconnected', 'close', 'fullsetup'].forEach(evt => {
    mongoose.connection.on(evt, () => {
      logger.info(`Mongoose connection is ${evt}.`);
    });
  });

  mongoose.connection.on('error', error => {
    logger.error(`Error connecting to MongoDB [${uri}]: ${error.message}`, error);
  });

  // monitor the replicaset
  if (mongoose.connection.db.serverConfig.s.replset) {
    ['joined', 'left'].forEach(evt => {
      mongoose.connection.db.serverConfig.s.replset.on(evt, (type, serverObj) => {
        logger.info(`Replset event: ${type} ${evt}`, serverObj.ismaster);
      });
    });

    mongoose.connection.db.serverConfig.s.replset.on('error', error => {
      logger.error(`Replset error: ${error.message}`, error);
    });
  }

  return connection;
}
