import { expect } from 'chai';

export default function methodNotAllowed(error) {
  expect(error).to.exist;
  expect(error.name).to.equal('NotImplementedError');
}
