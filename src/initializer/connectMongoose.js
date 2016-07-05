import Promise from 'bluebird';
import mongoose from 'mongoose';
import { ArgumentNullError, data } from 'common-errors';

export default connectionUri => new Promise((resolve, reject) => {
  if (!connectionUri) {
    reject(new ArgumentNullError('connectionUri'));
    return;
  }

  mongoose.connect(connectionUri);

  mongoose.connection.on('error', error => {
    reject(new data.MongoDBError(
      `Fail to connect database: ${connectionUri}`,
      error
    ));
    return;
  });

  mongoose.connection.once('open', () => {
    resolve('Database connected!');
  });
});
