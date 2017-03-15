import winston from 'winston';
import { check } from 'm800-util';

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

const SYSLOG_LEVELS = winston.config.syslog.levels;

export function createLogger(env) {
  check.ok('env', env);
  const logger = new (winston.Logger)({
    levels: {
      ...SYSLOG_LEVELS,
      // m800-service-discovery relies on "warn" which is "warning" in syslog levels
      warn: SYSLOG_LEVELS.warning,
    },
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
