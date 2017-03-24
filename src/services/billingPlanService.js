import Joi from 'joi';
import { ValidationError, NotFoundError } from 'common-errors';
import Promise from 'bluebird';
import csv from 'csv';
import _ from 'lodash';
import mime from 'mime';
import { check } from 'm800-util';

import { sanitize, mapPagingParameters, formatPage } from './util';
import {
  RateTableTypes,
  RateTableType,
  sanitizeRateTable,
  validateBillingPlanIntegrity,
  ExchangeRateValidationErrorType,
  SmsRateValidationErrorType,
  CallRateValidationErrorType,
  OFF_NET_CALL_RATE_TABLE_COLUMNS,
  SMS_RATE_TABLE_COLUMNS,
  EXCHANGE_RATE_TABLE_COLUMNS,
} from './../domain';

const parseCsv = Promise.promisify(csv.parse);
const stringifyCsv = Promise.promisify(csv.stringify);

export const RateTableValidationErrorType = {
  ...ExchangeRateValidationErrorType,
  ...SmsRateValidationErrorType,
  ...CallRateValidationErrorType,
  CsvParserFailure: 'csv.parserFailure',
};

export function billingPlanService(models) {
  check.members('models', models, [
    'RateTable',
    'OffNetCallRateTable',
    'SmsRateTable',
    'ExchangeRateTable',
    'BillingPlan',
  ]);

  const {
    RateTable,
    OffNetCallRateTable,
    SmsRateTable,
    ExchangeRateTable,
    BillingPlan,
  } = models;

  const createRateTable = _.cond([
    [
      _.matches({ type: RateTableType.CURRENCY_EXCHANGE }),
      data => new ExchangeRateTable(data),
    ],
    [
      _.matches({ type: RateTableType.OFFNET_CALL }),
      data => new OffNetCallRateTable(data),
    ],
    [
      _.matches({ type: RateTableType.SMS }),
      data => new SmsRateTable(data),
    ],
  ]);

  const COLUMN_NAMES = {
    [RateTableType.CURRENCY_EXCHANGE]: EXCHANGE_RATE_TABLE_COLUMNS,
    [RateTableType.SMS]: SMS_RATE_TABLE_COLUMNS,
    [RateTableType.OFFNET_CALL]: OFF_NET_CALL_RATE_TABLE_COLUMNS,
  };

  const UPLOAD_RATE_TABLE_COMMAND_SCHEMA = Joi.object({
    data: Joi.object({
      type: Joi.string().only(RateTableTypes),
      baseCurrency: Joi.when('type', {
        is: RateTableType.CURRENCY_EXCHANGE,
        then: Joi.number().required(),
        otherwise: Joi.optional(),
      }),
    }),
    file: Joi.object({
      name: Joi.string(),
      content: Joi.binary().required(),
    }),
  }).options({ presence: 'required' });

  async function uploadRateTable(command) {
    const { file, data } = sanitize(command, UPLOAD_RATE_TABLE_COMMAND_SCHEMA);
    let rows;
    try {
      rows = await parseCsv(file.content, { columns: true });
    } catch (e) {
      throw new ValidationError(
        `Failed to parse CSV data: ${e.message}.`,
        RateTableValidationErrorType.CsvParserFailure,
        'file.content',
      );
    }
    const rawTable = {
      name: file.name,
      rows,
      ...data,
    };
    const { result, error: validationError } = sanitizeRateTable(rawTable);
    if (validationError) {
      // Prepend "file.content" to error paths
      validationError.errors.forEach(e => {
        if (_.isString(e.field)) {
          e.field = `file.content.${e.field}`;
        }
      });
      throw validationError;
    }
    const table = createRateTable(result);
    await table.save();
    return { id: table.id.toString() };
  }

  const RATE_TABLE_ID_SCHEMA = Joi.object({
    rateTableId: Joi.string().required(),
  });

  async function formatRateTableAsCsvFile(table) {
    const rows = table.toJSON().rows;
    const csvOptions = {
      header: true,
      columns: COLUMN_NAMES[table.type],
    };
    const csvContent = await stringifyCsv(rows, csvOptions);
    return {
      name: table.name,
      contentType: mime.lookup('.csv'),
      content: new Buffer(csvContent, 'utf8'),
    };
  }

  async function downloadRateTable(query) {
    const { rateTableId } = sanitize(query, RATE_TABLE_ID_SCHEMA);
    const table = await RateTable.findById(rateTableId);
    if (!table) {
      throw new NotFoundError('RateTable');
    }
    return formatRateTableAsCsvFile(table);
  }

  function removeRateTable(command) {
    const { rateTableId } = sanitize(command, RATE_TABLE_ID_SCHEMA);
    return RateTable.remove({ _id: rateTableId });
  }

  function formatPlan(plan) {
    const planObj = _.isFunction(plan.toJSON) ? plan.toJSON() : plan;
    const rateTables = plan.rateTables
      .map(table => ({
        id: table._id.toString(),
        name: table.name,
        type: table.type,
      }));
    return {
      id: planObj._id.toString(),
      ..._.omit(planObj, ['_id', '__v', 'rateTables']),
      rateTables,
    };
  }

  const ID_SCHEMA = Joi.object().keys({
    id: Joi.string().required(),
  });

  const CREATE_BILLING_PLAN_SCHEMA = Joi.object().keys({
    name: Joi.string().min(1).required(),
    description: Joi.string(),
    companyId: Joi.string().required(),
    isAvailable: Joi.boolean().default(true),
    baseCurrency: Joi.number().required(),
    rateTables: Joi.array()
      .items(ID_SCHEMA)
      .required(),
  });

  async function createBillingPlan(command) {
    const sanitizedCommand = sanitize(command, CREATE_BILLING_PLAN_SCHEMA);
    const rateTableIds = sanitizedCommand.rateTables.map(table => table.id);
    const rateTables = await RateTable.find({
      _id: { $in: rateTableIds },
    });
    const billingPlan = new BillingPlan({
      ...sanitizedCommand,
      rateTables,
    });
    const validationError = validateBillingPlanIntegrity(billingPlan);
    if (validationError) {
      throw validationError;
    }
    await billingPlan.save();
    return formatPlan(billingPlan);
  }

  const UPDATE_BILLING_PLAN_SCHEMA = CREATE_BILLING_PLAN_SCHEMA.keys({
    billingPlanId: Joi.string().required(),
  });

  async function updateBillingPlan(command) {
    const { billingPlanId, ...updatedBillingPlan } = sanitize(command, UPDATE_BILLING_PLAN_SCHEMA);
    const billingPlan = await BillingPlan.findById(billingPlanId);
    if (!billingPlan) {
      throw new NotFoundError('BillingPlan');
    }
    const previousTableIds = billingPlan.rateTables.map(x => x.id);
    const currentTableIds = updatedBillingPlan.rateTables.map(x => x.id);
    const idsToRemove = _.difference(previousTableIds, currentTableIds);
    const idsToAdd = _.difference(currentTableIds, previousTableIds);
    const rateTablesToRemove = billingPlan.rateTables
      .filter(table => _.includes(idsToRemove, table.id.toString()));
    const rateTablesToAdd = idsToAdd.length === 0
      ? []
      : await RateTable.find({ _id: { $in: idsToAdd } });
    _.extend(billingPlan, _.omit(updatedBillingPlan, ['rateTables']));
    billingPlan.rateTables = _(billingPlan.rateTables)
      .difference(rateTablesToRemove)
      .concat(rateTablesToAdd)
      .value();
    const validationError = validateBillingPlanIntegrity(billingPlan);
    if (validationError) {
      throw validationError;
    }
    await billingPlan.save();
    return formatPlan(billingPlan);
  }

  const BILLING_PLAN_ID_SCHEMA = Joi.object().keys({
    billingPlanId: Joi.string().required(),
  });

  async function getBillingPlan(query) {
    const { billingPlanId } = sanitize(query, BILLING_PLAN_ID_SCHEMA);
    const billingPlan = await BillingPlan.findById(billingPlanId, { 'rateTables.rows': 0 });
    if (!billingPlan) {
      throw new NotFoundError('BillingPlan');
    }
    return formatPlan(billingPlan);
  }

  async function removeBillingPlan(command) {
    const { billingPlanId } = sanitize(command, BILLING_PLAN_ID_SCHEMA);
    await BillingPlan.remove({ _id: billingPlanId });
  }

  const BILLING_PLAN_QUERY_SCHEMA = Joi.object({
    companyId: Joi.string(),
    isAvailable: Joi.boolean(),
    searchQuery: Joi.string(),
    page: Joi.number().min(1),
    pageSize: Joi.number().min(1),
  });

  function createSearchFiler(searchQuery) {
    const regex = new RegExp(searchQuery, 'gi');
    return {
      $or: [
        { name: regex },
        { description: regex },
        { 'rateTables.name': regex },
      ],
    };
  }

  async function getBillingPlans(query) {
    const {
      page,
      pageSize,
      searchQuery,
      companyId,
      isAvailable,
    } = sanitize(query, BILLING_PLAN_QUERY_SCHEMA);
    const filter = _({ companyId, isAvailable })
      .pickBy(_.negate(_.isUndefined))
      .value();
    const search = _.isString(searchQuery) && searchQuery.length > 0
      ? createSearchFiler(searchQuery)
      : null;
    const filters = [filter, search]
      .filter(x => !(_.isNil(x) || _.isEmpty(x)));
    const mongoQuery = filters.length === 0
      ? {}
      : { $and: filters };
    const pagingParams = mapPagingParameters({ page, pageSize });
    const mongoOptions = {
      ...pagingParams,
      sort: { createdAt: -1 },
      lean: true,
    };
    const projection = { 'rateTables.rows': 0 };
    const [items, total] = await Promise.all([
      BillingPlan.find(mongoQuery, projection, mongoOptions),
      BillingPlan.count(mongoQuery),
    ]);
    return formatPage(pagingParams, items.map(formatPlan), total);
  }

  const DOWNLOAD_PLAN_RATE_TABLE_QUERY = BILLING_PLAN_ID_SCHEMA.keys({
    type: Joi.string().only(RateTableTypes).required(),
  });

  async function downloadRateTableFromPlan(query) {
    const { billingPlanId, type } = sanitize(query, DOWNLOAD_PLAN_RATE_TABLE_QUERY);
    const billingPlan = await BillingPlan.findById(billingPlanId);
    if (!billingPlan) {
      throw new NotFoundError('BillingPlan');
    }
    const rateTable = _.find(billingPlan.rateTables, { type });
    return formatRateTableAsCsvFile(rateTable);
  }

  return {
    uploadRateTable,
    downloadRateTable,
    removeRateTable,
    createBillingPlan,
    updateBillingPlan,
    removeBillingPlan,
    getBillingPlan,
    getBillingPlans,
    downloadRateTableFromPlan,
  };
}

export default billingPlanService;
