import _ from 'lodash';
import logger from '../../utils/logger';


export function getProperty(process, prop, defaultVal) {
  const val = process.getProperty(prop);
  if (!val) return defaultVal;

  if (!_.isArray(val) || !_.isPlainObject(val)) return val;

  try {
    return JSON.parse(val) || defaultVal;
  } catch (e) {
    logger.warning('Unable to deserialize taskResults from process', val, e.stack);
    return defaultVal;
  }
}

export function setProperty(process, prop, val) {
  if (!_.isArray(val) || !_.isPlainObject(val)) {
    process.setProperty(prop, val);
    return;
  }

  try {
    process.setProperty(prop, JSON.stringify(val));
  } catch (e) {
    logger.warning('Unable to serialize taskResults to process:', val, e.stack);
  }
}
