import { expect } from 'chai';

export default function missingRequiredField(key) {
  return error => {
    expect(error).to.exist;
    expect(error.name).to.equal('ValidationError');
    expect(error.code).to.equal('any.required');
    expect(error.field).to.equal(key);
  };
}
