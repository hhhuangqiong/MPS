import { expect } from 'chai';
import Joi from 'joi';
import { ValidationError } from 'common-errors';

import { sanitize } from './../../src/services';

describe('services/util', () => {
  describe('util/sanitize', () => {
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
      expect(() => sanitize(input, jsonSchema))
        .not.throw('correct input data does not throw');
    });

    it('throws validation error when invalid data', () => {
      const input = {
        id: 1,
        data: ['wrongData'],
      };
      expect(() => sanitize(input, jsonSchema)).to.throw(ValidationError);
    });
  });
});
