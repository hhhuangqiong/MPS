import { check } from 'm800-util';
import Joi from 'joi';
import _ from 'lodash';

const PAGING_PARAMS_SCHEMA = Joi.object({
  page: Joi.number().min(1).optional(),
  pageSize: Joi.number().min(1).optional(),
});

export function convertToMongoPagingParameters(params, defaultPageSize = 20) {
  check.schema('params', params, PAGING_PARAMS_SCHEMA);
  check.predicate('defaultPageSize', defaultPageSize, x => _.isNumber(x) && x > 0);

  const { page, pageSize } = params;

  // If none of them are specified, then no paging restrictions
  if (!_.isNumber(page) && !_.isNumber(pageSize)) {
    return {};
  }
  const finalPage = _.isNumber(page) ? page : 1;
  const finalPageSize = _.isNumber(pageSize) ? pageSize : defaultPageSize;
  const skip = (finalPage - 1) * finalPageSize;
  return {
    skip,
    limit: finalPageSize,
  };
}

export function formatPage(pageParams, items, total) {
  check.schema('pageParams', pageParams, PAGING_PARAMS_SCHEMA);
  check.predicate('items', items, _.isArray);
  check.predicate('total', total, _.isNumber);
  check.predicate(
    'total',
    total,
    x => x >= items.length,
    'Total number of items should be greater or equal to number of page items.'
  );

  const { page, pageSize } = pageParams;

  const finalPage = _.isNumber(page) ? page : 1;
  const finalPageSize = _.isNumber(pageSize) ? pageSize : items.length;
  const pageTotal = finalPageSize === 0 ? 0 : Math.ceil(total / finalPageSize);

  return {
    page: finalPage,
    pageSize: finalPageSize,
    pageTotal,
    total,
    items,
  };
}
