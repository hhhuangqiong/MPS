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
  }));
  const { uri, server } = mongoOptions;

  const connection = mongoose.connect(uri, { server });

  mongoose.connection.on('open', () => {
    logger.info(`Connected to MongoDB [${uri}]`);
  });

  mongoose.connection.on('error', error => {
    logger.error(`Error connecting to MongoDB [${uri}]: ${error.message}`, error);
  });

  return connection;
}
