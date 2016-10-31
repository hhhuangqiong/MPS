import Promise from 'bluebird';
import _ from 'lodash';

export function memoryKeyValueStorage(data) {
  const state = _.cloneDeep(data);

  function get(key) {
    return Promise.try(() => {
      const result = _.get(state, key);
      return _.cloneDeep(result);
    });
  }

  return {
    get,
  };
}

export default memoryKeyValueStorage;
