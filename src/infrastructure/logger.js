import winston from 'winston';

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

export const defaultLogger = new (winston.Logger)({
  levels: winston.config.syslog.levels,
  transports: [
    new winston.transports.Console({
      level: 'debug',
      colorize: true,
    }),
  ],
});

winston.addColors(LOG.colors);

export default defaultLogger;
