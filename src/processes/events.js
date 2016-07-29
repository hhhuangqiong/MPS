import logger from '../initializer/logger';

export function PROVISIONING_START(data, done) {
  logger('Provisioning Started', data);
  done(data);
}

export function PROVISIONING_END(data, done) {
  logger('Provisioning Ended', data);
  done(data);
}
