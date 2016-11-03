import isShallowEqual from 'shallowequal';

export function createStore(process) {
  const STATE_PROPERTY_NAME = 'state';

  function get() {
    return process.getProperty(STATE_PROPERTY_NAME);
  }

  function set(state) {
    const currentState = process.getProperty(STATE_PROPERTY_NAME);
    if (isShallowEqual(currentState, state)) {
      return currentState;
    }
    process.setProperty(STATE_PROPERTY_NAME, state);
    return state;
  }

  return {
    get,
    set,
  };
}

export default createStore;
