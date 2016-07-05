import Promise from 'bluebird';
import { ArgumentNullError } from 'common-errors';

export default server => new Promise((resolve, reject) => {
  if (!server) {
    reject(new ArgumentNullError('server'));
    return;
  }

  if (!server.get('port')) {
    reject(new ArgumentNullError('port'));
    return;
  }

  server.listen(server.get('port'), () => {
    resolve(`Server is running in ${server.get('env')} at ${server.get('port')}`);
  });
});
