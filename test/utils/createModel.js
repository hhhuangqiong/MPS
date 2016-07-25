import { describe, it } from 'mocha';
import { expect } from 'chai';

import createModel from '../../src/utils/createModel';

describe('utils/createModel', () => {
  describe('Validation', () => {
    it('should fail when missing name', () => {
      expect(() => createModel()).to.throw('ArgumentNullError: Missing argument: name');
    });

    it('should fail when schema is empty', () => {
      expect(() => createModel('Book')).to.throw('ArgumentNullError: Missing argument: schema');
    });

    it('should fail when schema is not an object', () => {
      expect(() => createModel('Book', 'I am a string'))
        .to.throw('TypeError: schema is not an object');
    });
  });

  it('should be an instance of model object', () => {
    expect(createModel('Book', { schemaKey: String })).to.be.instanceof(Object);
  });
});
