// In order to support async/await
import 'babel-polyfill';

import healthCheck from 'm800-health-check';

import server from './server';
import ioc from '../ioc';

const { mongoose, logger } = ioc.container;

mongoose.ready.then(() => {
  server.listen(server.get('port'), () => {
    logger(`Server is running in ${server.get('env')} at ${server.get('port')}`);
  });
});

healthCheck(server, {
  mongodb: {
    mongoose,
  },
});
