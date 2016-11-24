import { stringToPath } from '../../src/util';
import { expect } from 'chai';

describe('util/stringToPath', () => {
  it('converts string to path with correct format', () => {
    const pathArray = stringToPath('items[0].name');
    expect(pathArray).to.deep.equal(['items', '0', 'name']);
  });

  it('converts string to path with padding .', () => {
    const pathArray = stringToPath('.items[0].name');
    expect(pathArray).to.deep.equal(['', 'items', '0', 'name']);
  });
});
