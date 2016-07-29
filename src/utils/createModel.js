import { isEmpty } from 'lodash';
import mongoose from 'mongoose';

import {
  ArgumentNullError,
  TypeError,
} from 'common-errors';

const DEFAULT_SCHEMA = {
  created_at: { type: Date, default: Date.now },
};

export default (schema = {}) => {
  if (typeof schema !== 'object') {
    throw new TypeError('schema is not an object');
  }

  if (isEmpty(schema)) {
    throw new ArgumentNullError('schema');
  }

  return new mongoose.Schema(Object.assign({}, DEFAULT_SCHEMA, schema));
};
