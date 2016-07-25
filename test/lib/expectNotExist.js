import { expect } from 'chai';

export default function expectNotExist(target) {
  expect(target).to.not.exist;
}
