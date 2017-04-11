import { expect } from 'chai';
import Joi from 'joi';
import _ from 'lodash';
import { ValidationError } from 'common-errors';

import { sanitize, formatPage } from './../../src/services';

describe('services/util', () => {
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
  describe('formatPage', () => {
    it('formats empty page', () => {
      const page = formatPage({}, [], 0);
      expect(page).to.eql({
        items: [],
        page: 1,
        pageSize: 0,
        pageTotal: 0,
        total: 0,
      });
    });
    it('formats empty page when requested page is out of range', () => {
      const page = formatPage({ page: 2 }, [], 0);
      expect(page).to.eql({
        items: [],
        page: 2,
        pageSize: 0,
        pageTotal: 0,
        total: 0,
      });
    });
    it('formats all items as a page when no paging parameters are passed', () => {
      const items = _.range(15);
      const page = formatPage({}, items, items.length);
      expect(page).to.eql({
        items,
        page: 1,
        pageSize: 15,
        pageTotal: 1,
        total: 15,
      });
    });
    it('formats last page', () => {
      const items = _.range(3);
      const pageSize = 5;
      const page = formatPage({ page: 2, pageSize }, items, pageSize + items.length);
      expect(page).to.eql({
        items,
        page: 2,
        pageSize: 5,
        pageTotal: 2,
        total: 8,
      });
    });
    it('formats first page', () => {
      const items = _.range(3);
      const page = formatPage({ pageSize: 3 }, items, 10);
      expect(page).to.eql({
        items,
        page: 1,
        pageSize: 3,
        pageTotal: 4,
        total: 10,
      });
    });
    it('formats middle page', () => {
      const items = _.range(5);
      const page = formatPage({ pageSize: 5, page: 2 }, items, 16);
      expect(page).to.eql({
        items,
        page: 2,
        pageSize: 5,
        pageTotal: 4,
        total: 16,
      });
    });
  });
});
