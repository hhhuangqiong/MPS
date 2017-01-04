import _ from 'lodash';
import { Schema } from 'mongoose';
import { check } from 'm800-util';

import { stringToPath } from './../util';

export function mongoKeyValueStorage(mongooseConnection, options = {}) {
  check.ok('mongooseConnection', mongooseConnection);
  options = _.defaults(options, {
    collectionName: 'config',
    documentId: 'default',
  });

  const schema = new Schema({
    _id: { type: String },
  }, {
    strict: false,
    versionKey: false,
  });
  const Config = mongooseConnection.model('Config', schema, options.collectionName);

  function getDeepestPossibleProjection(key) {
    const path = stringToPath(key);
    return _.takeWhile(path, part => !/\d+/.test(part)).join('.');
  }

  async function get(key) {
    check.predicate('key', key, x => _.isString(x) && x.length > 0, 'Key should be a string.');

    // Project to reduce amount of useless data fetched
    const projection = getDeepestPossibleProjection(key);
    const doc = await Config.findById(options.documentId).select(projection);
    if (!doc) {
      return undefined;
    }
    const json = doc.toJSON();
    const result = _.get(json, key);
    return result;
  }

  return {
    get,
  };
}

export default mongoKeyValueStorage;
