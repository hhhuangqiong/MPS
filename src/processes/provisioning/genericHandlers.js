import ioc from '../../ioc';

const { logger } = ioc.container;

export function defaultErrorHandler(error, done) {
  logger('error', error.stack);
  done();
}

// exported but it is not being used at this moment
export function onBeginHandler(currentFlowObjectName, data, done) {
  logger('onBeginHandler');
  done(data);
}

export function onEndHandler(currentFlowObjectName, data, done) {
  logger('onEndHandler');

  done(data);
}
