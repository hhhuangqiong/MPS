import { expect } from 'chai';
import getFromPath from 'lodash/get';

export default function expectPathExist(path) {
  return target => {
    expect(getFromPath(target, path)).to.exist;
  };
}
