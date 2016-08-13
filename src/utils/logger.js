import winston from 'winston';

const LOG = {
  levels: {
    info: 0,
    debug: 0,
    warn: 1,
    error: 2,
    fatal: 3,
  },
  colors: {
    info: 'green',
    debug: 'blue',
    warn: 'yellow',
    error: 'red',
    fatal: 'red',
  },
};

const DEFAULT_LEVEL = 'info';

const logger = new (winston.Logger)({
  transports: [
    new winston.transports.Console({
      colorize: true,
    }),
  ],
});

logger.setLevels(LOG.levels);
winston.addColors(LOG.colors);

/**
 * Winston logger with custom levels and capabilities.
 * @param {string} level - The logger level or message for single argument.
 * @param {...string} [messages] - Arguements of message.
 * @example
 * // return fatal: message
 * logger('fatal', 'message');
 * @example
 * // return info: message
 * logger('message');
 * @example
 * // return info: message1, message2, message3
 * logger('message1', 'message2', 'message3');
 * @example
 * // return error: Log message is missing
 * logger();
 * @example
 * // return info:
 * logger('info');
 * @example
 * // return warn: error message
 * logger('warn', new Error('error message'));
 * @example
 * // return error message
 * logger(new Error('error message'));
 */
export default (...messages) => {
  if (!messages.length) {
    winston.error('Log message is missing');
    return;
  }

  const level = LOG.levels.hasOwnProperty(messages[0]) ? messages.shift() : DEFAULT_LEVEL;

  const stringifiedMessage = messages
    .map(message => (typeof message === 'object' ? JSON.stringify(message, null, 2) : message))
    .map(message => (message instanceof Error ? message.message : message))
    .join(', ');

  if (!stringifiedMessage.length) {
    return;
  }

  try {
    logger[level](stringifiedMessage);
  } catch (e) {
    winston.error(e.message);
  }
};
