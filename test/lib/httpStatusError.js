import { expect } from 'chai';

export default function httpStatusError(status, message, code) {
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
