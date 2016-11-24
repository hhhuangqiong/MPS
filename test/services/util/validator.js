import { expect } from 'chai';
import Joi from 'joi';
import sinon from 'sinon';
import { ValidationError } from 'common-errors';

import validator from '../../../src/services/util/validator';

describe('service/util/validator', () => {
  describe('sanitize', () => {
    const jsonSchema = {
      id: Joi.number().required(),
      name: Joi.string().required(),
      data: Joi.array().items(Joi.number()),
    };

    it('coerces valid data to the scheme type', () => {
      const input = {
        id: 1,
        name: 'Maaii',
        data: [1, 3, 5, 7, 9],
      };
      expect(() => validator.sanitize(input, jsonSchema))
        .not.throw('correct input data does not throw');
    });

    it('throws validation error when invalid data', () => {
      const input = {
        id: 1,
        data: ['wrongData'],
      };
      expect(() => validator.sanitize(input, jsonSchema)).to.throw(ValidationError);
    });
  });

  describe('verify', () => {
    const dummyData = { a: 1 };

    it('verifies correct data without error', () => {
      const verifierStub = sinon.stub().returns([]);
      expect(() => validator.verify(dummyData, verifierStub)).not.throw('correct input data does not throw');
      expect(validator.verify(dummyData, verifierStub)).to.deep.equal(dummyData);
    });

    it('verifies incorrect data and return error string', () => {
      const errorMessage = 'Duplicate data';
      const verifierStub = sinon.stub().returns([errorMessage]);
      expect(() => validator.verify(dummyData, verifierStub)).to.throw(ValidationError, errorMessage);
    });

    it('verifies incorrect data and return empty error string', () => {
      const verifierStub = sinon.stub().returns(['']);
      expect(() => validator.verify(dummyData, verifierStub)).to.throw(ValidationError);
    });

    it('verifies incorrect data and return error object message', () => {
      const errorMessage = 'Duplicate data';
      const errorObject = { message: errorMessage };
      const verifierStub = sinon.stub().returns([errorObject]);
      expect(() => validator.verify(dummyData, verifierStub)).to.throw(ValidationError, errorMessage);
    });

    it('verifies incorrect data and return error object without message', () => {
      const verifierStub = sinon.stub().returns({ error: 'test' });
      expect(() => validator.verify(dummyData, verifierStub)).to.throw(ValidationError);
    });

    it('verifies incorrect data and return with multiple error messages', () => {
      const errorMessages = ['incorrect format', 'missing value'];
      const verifierStub = sinon.stub().returns(errorMessages);
      expect(() => validator.verify(dummyData, verifierStub)).to.throw(ValidationError, 'multiple invalid fields');
    });
  });
});
