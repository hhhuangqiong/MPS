import winston from 'winston';

import { check } from './../util';

const LOG = {
  colors: {
    debug: 'blue',
    info: 'green',
    notice: 'orange',
    warn: 'yellow',
    error: 'red',
    emerg: 'red',
    crit: 'red',
    alert: 'red',
  },
};
winston.addColors(LOG.colors);

export function createLogger(env) {
  check.ok('env', env);
  const logger = new (winston.Logger)({
    levels: winston.config.syslog.levels,
    transports: [
      new winston.transports.Console({
        level: 'debug',
        colorize: env === 'development',
      }),
    ],
  });
  return logger;
}

export default createLogger;
