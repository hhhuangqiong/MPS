import { EventEmitter } from 'events';

export function createEventBus() {
  return new EventEmitter();
}

export default createEventBus;
