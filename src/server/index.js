// In order to support async/await
import 'babel-polyfill';
import 'source-map-support/register';

import healthCheck from 'm800-health-check';

import logger from '../utils/logger';
import server from './server';
import ioc from '../ioc';

const { mongoose } = ioc.container;

mongoose.ready.then(() => {
  server.listen(server.get('port'), () => {
    logger.info(`Server is running in ${server.get('env')} at ${server.get('port')}`);
  });
});

healthCheck(server, {
  mongodb: {
    mongoose,
  },
});
