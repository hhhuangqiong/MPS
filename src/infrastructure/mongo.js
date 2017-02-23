import Joi from 'joi';
import Promise from 'bluebird';
import _ from 'lodash';
import mongoose from 'mongoose';
import { check } from 'm800-util';

// Use bluebird promises instead of mpromise
mongoose.Promise = Promise;

const CONNECTION_EVENTS = [
  'open',
  'connecting',
  'connected',
  'reconnected',
  'disconnected',
  'close',
  'fullsetup',
];

const REPLICA_SET_EVENTS = [
  'joined',
  'left',
];

export function mongooseConnectionFactory(logger, resolveUri, options = {}) {
  check.ok('logger', logger);
  check.predicate('resolveUri', resolveUri, _.isFunction);
  options = check.sanitizeSchema('options', options, Joi.object({
    connectionOptions: Joi.object().optional(),
    debug: Joi.boolean().optional().default(false),
  }));

  mongoose.set('debug', options.debug);

  async function connect() {
    const uri = await resolveUri();
    // We don't use mongoose.connect() and use createConnection() instead to support multiple connections in tests
    const connection = Promise.promisifyAll(mongoose.createConnection(uri, options.connectionOptions));

    CONNECTION_EVENTS.forEach(name => connection.on(name, () => logger.info('Mongoose connection is %s.', name)));
    connection.on('error', (e) => {
      e.uri = uri;
      logger.error('Error connecting to MongoDB: %s.', e.message, e);
    });
    const replicaSet = connection.db.serverConfig.s.replset;
    if (replicaSet) {
      REPLICA_SET_EVENTS.forEach(name =>
        replicaSet.on(name, (type, server) => {
          logger.info('MongoDB replica set changed: %s (%s).', name, type, { server });
        })
      );
      replicaSet.on('error', e => logger.error('MongoDB replica set error: %s', e.message, e));
    }
    await new Promise((resolve, reject) => {
      connection.once('connected', resolve);
      connection.once('error', reject);
    });
    return connection;
  }

  return {
    connect,
  };
}

