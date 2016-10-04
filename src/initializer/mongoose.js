import Promise from 'bluebird';
import mongoose from 'mongoose';
import { ArgumentNullError, data } from 'common-errors';

// Use native promises instead of mpromise
mongoose.Promise = global.Promise;

export default function init(mongoDbUri, mongoDbServerOpts) {
  if (!mongoDbUri) {
    throw new ArgumentNullError('mongoUri');
  }

  mongoose.connect(mongoDbUri, { server: mongoDbServerOpts });

  mongoose.ready = new Promise((resolve, reject) => {
    mongoose.connection.on('error', error => {
      reject(new data.MongoDBError(
        `Fail to connect database: ${mongoDbUri}`,
        error
      ));
      return;
    });

    mongoose.connection.once('open', () => {
      resolve(mongoose);
    });
  });

  return mongoose;
}
