import { isEmpty } from 'lodash';
import mongoose from 'mongoose';
import { ArgumentNullError } from 'common-errors';

const DEFAULT_SCHEMA = {
  created_at: { type: Date, default: Date.now },
};

export default (name, schema = {}) => {
  if (!name) {
    throw new ArgumentNullError('name');
  }

  if (isEmpty(schema)) {
    throw new ArgumentNullError('schema');
  }

  const modelSchema = new mongoose.Schema(Object.assign({}, DEFAULT_SCHEMA, schema));

  return mongoose.model(name, modelSchema);
};
