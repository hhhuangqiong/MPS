import _ from 'lodash';
import { check } from 'm800-util';

export function compositeKeyValueStorage(storages) {
  check.predicate('storages', storages, _.isArray, 'Storages should be an array of key-value storages');

  async function get(key) {
    let result;
    for (const storage of storages) {
      result = await storage.get(key);
      if (result) {
        break;
      }
    }
    return result;
  }

  return {
    get,
  };
}

export default compositeKeyValueStorage;
