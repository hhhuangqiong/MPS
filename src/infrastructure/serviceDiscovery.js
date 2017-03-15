import Joi from 'joi';
import { check } from 'm800-util';
import { ServiceDiscoveryAgent } from 'm800-service-discovery';

export function createServiceDiscoveryAgent(logger, options) {
  check.ok('logger', logger);
  check.schema('options', options, Joi.object({
    region: Joi.string(),
    zkConnectionString: Joi.string(),
  }));

  return new ServiceDiscoveryAgent({
    logger,
    region: options.region,
    zookeeperConnectionString: options.zkConnectionString,
  });
}

export function createMongoUriResolver(serviceLookup, logger, options) {
  check.ok('serviceLookup', serviceLookup);
  check.ok('logger', logger);
  check.schema('options', options, Joi.object({
    serviceName: Joi.string().allow(null).optional(),
    uriOptions: Joi.object({
      database: Joi.string(),
    }),
    fallbackUri: Joi.string(),
  }));
  if (!options.serviceName) {
    logger.info('No service name specified for MongoDB. Will use fallback connection string uri.');
    return () => Promise.resolve(options.fallbackUri);
  }
  return async () => {
    try {
      const mongoService = await serviceLookup.findMongoDB(options.serviceName, options.uriOptions);
      logger.info('Discovered MongoDB service at %s.', mongoService.safeUri);
      return mongoService.uri;
    } catch (e) {
      logger.warn('Failed to discover MongoDB service: %s. Will use fallback connection string.', e.message, e);
      return options.fallbackUri;
    }
  };
}

export function createApiUriResolver(serviceLookup, logger, options) {
  check.ok('serviceLookup', serviceLookup);
  check.ok('logger', logger);
  check.schema('options', options, Joi.object({
    friendlyServiceName: Joi.string(),
    serviceName: Joi.string().allow(null).optional(),
    fallbackUri: Joi.string(),
  }));
  if (!options.serviceName) {
    logger.info('No service name specified for %s. Will use fallback uri.', options.friendlyServiceName);
    return () => Promise.resolve(options.fallbackUri);
  }
  let discoveryAttempts = 0;
  return async () => {
    discoveryAttempts++;
    try {
      const apiService = await serviceLookup.findApi(options.serviceName);
      if (discoveryAttempts === 1) {
        logger.info('Discovered "%s" for the first time at %s.', options.serviceName, apiService.uri);
      }
      return apiService.uri;
    } catch (e) {
      logger.warning('Failed to discover (attempt #%d) "%s": %s. Will use fallback uri.',
        discoveryAttempts,
        options.serviceName,
        e.message,
        e,
      );
      return options.fallbackUri;
    }
  };
}
