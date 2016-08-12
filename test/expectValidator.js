import { expect } from 'chai';

export function expectOk(target) {
  expect(target.ok).to.be.true;
}

export function expectNotExist(target) {
  expect(target).to.not.exist;
}

export function expectPathExist(path) {
  return target => {
    expect(getFromPath(target, path)).to.exist;
  };
}

export function httpStatusError(status, message, code) {
  return error => {
    expect(error).to.exist;
    expect(error.name).to.equal('HttpStatusError');
    expect(error.status).to.equal(status);

    if (message) {
      expect(error.message).to.equal(message);
    }

    if (code) {
      expect(error.code).to.equal(code);
    }
  };
}

export function methodNotAllowed(error) {
  expect(error).to.exist;
  expect(error.name).to.equal('NotImplementedError');
}

export function missingRequiredField(key) {
  return error => {
    expect(error).to.exist;
    expect(error.name).to.equal('ValidationError');
    expect(error.code).to.equal('any.required');
    expect(error.field).to.equal(key);
  };
}
