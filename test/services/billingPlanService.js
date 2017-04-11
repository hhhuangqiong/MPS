import chai, { expect } from 'chai';
import { stub, match, assert as sinonAssert } from 'sinon';
import chaiPromised from 'chai-as-promised';
import Promise from 'bluebird';
import _ from 'lodash';
import { ValidationError, NotFoundError } from 'common-errors';
import currency from 'currency-codes';
import { Types } from 'mongoose';

import {
  createRateTableModel,
  createExchangeRateTableModel,
  createOffNetCallRateTableModel,
  createSmsRateTableModel,
  createBillingPlanModel,
  billingPlanService as createBillingPlanService,
  RateTableValidationErrorType,
} from './../../src/services';
import { RateTableType, PhoneNumberType, BillingPlanValidationErrorType } from './../../src/domain';
import { createTestContext } from './test-context';

chai.use(chaiPromised);

function decorate(test) {
  return async () => {
    let connection;
    try {
      const context = await createTestContext();
      connection = context.connection;
      const RateTable = createRateTableModel(connection);
      const ExchangeRateTable = createExchangeRateTableModel(RateTable);
      const OffNetCallRateTable = createOffNetCallRateTableModel(RateTable);
      const SmsRateTable = createSmsRateTableModel(RateTable);
      const BillingPlan = createBillingPlanModel(connection);
      const models = {
        RateTable,
        ExchangeRateTable,
        OffNetCallRateTable,
        SmsRateTable,
        BillingPlan,
      };
      const billingPlanService = createBillingPlanService(models);
      await Promise.try(() => test({
        ...context,
        ...models,
        billingPlanService,
      }));
    } finally {
      if (connection) {
        await connection.closeAsync();
      }
    }
  };
}

describe('services/billingPlanService', () => {
  describe('uploadRateTable', () => {
    it('saves exchange rate table to the database and returns the id',
      decorate(async ({ billingPlanService, ExchangeRateTable }) => {
        const command = {
          data: {
            type: RateTableType.CURRENCY_EXCHANGE,
            baseCurrency: 840,
          },
          file: {
            name: 'exchange-rates.csv',
            content: new Buffer(
              `name,code,rate
               EUR,978,1.1
               HKD,344,7.6`
            ),
          },
        };

        const { id } = await billingPlanService.uploadRateTable(command);
        const table = (await ExchangeRateTable.findById(id)).toJSON();

        expect(table).to.exist;
        expect(table.name).to.equal(command.file.name);
        expect(table.baseCurrency).to.equal(command.data.baseCurrency);
        expect(table.rows).to.have.length(2);
      })
    );

    it('saves sms rate table to the database and returns the id',
      decorate(async ({ billingPlanService, SmsRateTable }) => {
        const command = {
          data: {
            type: RateTableType.SMS,
          },
          file: {
            name: 'exchange-rates.csv',
            content: new Buffer(
              `name,phoneCode,rate
             Abkhazia,7,0.04816
             Albania,355,0.04816`
            ),
          },
        };

        const { id } = await billingPlanService.uploadRateTable(command);
        const table = (await SmsRateTable.findById(id)).toJSON();

        expect(table).to.exist;
        expect(table.name).to.equal(command.file.name);
        expect(table.rows).to.have.length(2);
      })
    );

    it('saves off-net call rate table to the database and returns the id',
      decorate(async ({ billingPlanService, OffNetCallRateTable }) => {
        const command = {
          data: {
            type: RateTableType.OFFNET_CALL,
          },
          file: {
            name: 'off-net-call-rates.csv',
            content: new Buffer(
              `name,countryCode,phoneNumberType,phoneCode,rate
             AFGHANISTAN - Fixed,AF,LANDLINE,93,5.8859
             AFGHANISTAN - Mobile,AF,MOBILE,937,5.9
             AFGHANISTAN - Mobile - AT,AF,MOBILE,9375,5.9
             AFGHANISTAN - Mobile - AWS,AF,MOBILE,9370,5.9
             AUSTRIA - Fixed,AT,LANDLINE,43,5.8859
             AUSTRIA - Mobile,AT,MOBILE,43650,5.8859
             AUSTRIA - Mobile,AT,MOBILE,43660,5.8859
             AUSTRIA - Mobile,AT,MOBILE,43661,5.8859`
            ),
          },
        };

        const { id } = await billingPlanService.uploadRateTable(command);
        const table = (await OffNetCallRateTable.findById(id)).toJSON();

        expect(table).to.exist;
        expect(table.name).to.equal(command.file.name);
        expect(table.rows).to.have.length(8);
      })
    );

    it('throws "csv format" validation error when csv is poorly formatted', async () => {
      const billingPlanService = createBillingPlanService({
        ExchangeRateTable: {},
        SmsRateTable: {},
        OffNetCallRateTable: {},
        RateTable: {},
        BillingPlan: {},
      });
      const command = {
        file: {
          name: 'sms-rates.csv',
          content: new Buffer(
            // Wrong decimal separator
            `name,phoneCode,rate
             Abkhazia,7,0,04816
             Albania,355,0,04816`,
          ),
        },
        data: { type: RateTableType.SMS },
      };

      const error = await expect(billingPlanService.uploadRateTable(command)).to.be.rejectedWith(ValidationError);
      expect(error.code).to.equal(RateTableValidationErrorType.CsvParserFailure);
    });

    it('throws validation error when there are business logic errors in CSV', async () => {
      const billingPlanService = createBillingPlanService({
        ExchangeRateTable: {},
        SmsRateTable: {},
        OffNetCallRateTable: {},
        RateTable: {},
        BillingPlan: {},
      });
      const command = {
        file: {
          name: 'sms-rates.csv',
          // Invalid phone code in Albania
          content: new Buffer(
            `name,phoneCode,rate
             Abkhazia,7,0.04816
             Albania,9999,0.04816`,
          ),
        },
        data: { type: RateTableType.SMS },
      };

      const error = await expect(billingPlanService.uploadRateTable(command)).to.be.rejectedWith(ValidationError);
      expect(error.errors).to.be.an('array');
      expect(error.errors[0].field).to.match(/^file.content.rows.1/);
    });

    it('throws validation error when command does not match the schema', async () => {
      const billingPlanService = createBillingPlanService({
        ExchangeRateTable: {},
        SmsRateTable: {},
        OffNetCallRateTable: {},
        RateTable: {},
        BillingPlan: {},
      });
      const inputs = [
        {
          file: {
            content: null,
          },
          data: {
            type: RateTableType.OFFNET_CALL,
          },
        },
        {
          file: {
            content: new Buffer('LOL'),
            name: 'some-name.csv',
          },
          data: {
            type: 'UNKNOWN',
          },
        },
      ];

      for (const command of inputs) {
        await expect(billingPlanService.uploadRateTable(command)).to.be.rejectedWith(ValidationError);
      }
    });
  });

  describe('downloadRateTable', () => {
    it('returns file object', decorate(async ({ billingPlanService, ExchangeRateTable }) => {
      const rateTable = await ExchangeRateTable.create({
        name: 'exchange-rates.csv',
        baseCurrency: _.parseInt(currency.code('USD').number),
        rows: [
          {
            rate: 1.1,
            name: 'EUR',
            code: 978,
          },
          {
            rate: 7.6,
            name: 'HKD',
            code: 344,
          },
        ],
      });
      const id = rateTable.id.toString();

      const rateTableFile = await billingPlanService.downloadRateTable({ rateTableId: id });
      expect(rateTableFile).to.exist;
      expect(rateTableFile.name).to.equal(rateTable.name);
      expect(rateTableFile.contentType).to.equal('text/csv');
      expect(rateTableFile.content).to.be.instanceOf(Buffer);
    }));

    it('throws "not found error" when there is no rate table', decorate(async ({ billingPlanService }) => {
      const id = (new Types.ObjectId()).toString();
      await expect(billingPlanService.downloadRateTable({ rateTableId: id })).to.be.rejectedWith(NotFoundError);
    }));
  });

  describe('removeRateTable', () => {
    it('removes document from database', decorate(async ({ billingPlanService, ExchangeRateTable }) => {
      const rateTable = await ExchangeRateTable.create({
        name: 'exchange-rates.csv',
        baseCurrency: _.parseInt(currency.code('USD').number),
        rows: [
          {
            rate: 1.1,
            name: 'EUR',
            code: 978,
          },
          {
            rate: 7.6,
            name: 'HKD',
            code: 344,
          },
        ],
      });
      const id = rateTable.id.toString();

      await billingPlanService.removeRateTable({ rateTableId: id });

      const removedRateTable = await ExchangeRateTable.findById(id);
      expect(removedRateTable).to.not.exist;
    }));
  });

  describe('createBillingPlan', () => {
    it('creates billing plan in the database',
      decorate(async ({ billingPlanService, ExchangeRateTable, SmsRateTable, OffNetCallRateTable, BillingPlan }) => {
        const tables = [
          new ExchangeRateTable({
            _id: new Types.ObjectId(),
            name: 'exchange-rates.csv',
            baseCurrency: currency.code('USD').number,
            rows: [
              {
                name: 'EUR',
                code: _.parseInt(currency.code('EUR').number),
                rate: 1.1,
              },
              {
                name: 'HKD',
                code: _.parseInt(currency.code('HKD').number),
                rate: 7.2,
              },
            ],
          }),
          new SmsRateTable({
            _id: new Types.ObjectId(),
            name: 'sms-rates.csv',
            rows: [
              { name: 'Albania', phoneCode: '355', rate: 2.5 },
              { name: 'Hong Kong', phoneCode: '852', rate: 3.6 },
            ],
          }),
          new OffNetCallRateTable({
            _id: new Types.ObjectId(),
            name: 'off-net-calls.csv',
            rows: [
              {
                name: 'AFGHANISTAN - Fixed',
                countryCode: 'AF',
                phoneNumberType: PhoneNumberType.LANDLINE,
                phoneCode: '93',
                rate: 5.8859,
              },
              {
                name: 'AFGHANISTAN - Mobile',
                countryCode: 'AF',
                phoneNumberType: PhoneNumberType.MOBILE,
                phoneCode: '937',
                rate: 5.9,
              },
            ],
          }),
        ];
        const command = {
          name: 'Gold',
          description: 'Billing plan for Gold customers.',
          baseCurrency: tables[0].baseCurrency,
          companyId: new Types.ObjectId().toString(),
          isAvailable: true,
          rateTables: tables.map(table => ({
            id: table.id.toString(),
            type: table.type,
          })),
        };

        await Promise.all(tables.map(table => table.save()));
        const billingPlan = await billingPlanService.createBillingPlan(command);

        expect(billingPlan.id).to.be.a('string');
        expect(billingPlan).to.contain.all.keys(command);
        const storedBillingPlan = await BillingPlan.findById(billingPlan.id);
        expect(storedBillingPlan).to.exist;
      }),
    );

    it('throws validation error when some of the rate tables are not found in database',
      decorate(async ({ billingPlanService, ExchangeRateTable }) => {
        const exchangeRateTable = new ExchangeRateTable({
          _id: new Types.ObjectId(),
          name: 'exchange-rates.csv',
          baseCurrency: _.parseInt(currency.code('USD').number),
          rows: [
            {
              name: 'EUR',
              code: _.parseInt(currency.code('EUR').number),
              rate: 1.1,
            },
            {
              name: 'HKD',
              code: _.parseInt(currency.code('HKD').number),
              rate: 7.2,
            },
          ],
        });
        const command = {
          name: 'Gold',
          description: 'Gold plan for best customers',
          baseCurrency: exchangeRateTable.baseCurrency,
          companyId: new Types.ObjectId().toString(),
          rateTables: [
            {
              id: exchangeRateTable._id.toString(),
              type: RateTableType.CURRENCY_EXCHANGE,
            },
            {
              id: new Types.ObjectId().toString(),
              type: RateTableType.SMS,
            },
            {
              id: new Types.ObjectId().toString(),
              type: RateTableType.OFFNET_CALL,
            },
          ],
        };

        await exchangeRateTable.save();
        const error = await expect(billingPlanService.createBillingPlan(command)).to.be.rejectedWith(ValidationError);
        expect(error.code).to.equal(BillingPlanValidationErrorType.MissingRateTable);
      }),
    );
  });

  describe('updateBillingPlan', () => {
    it('updates billing plan in the database',
      decorate(async ({ billingPlanService, BillingPlan, SmsRateTable }) => {
        const billingPlan = new BillingPlan({
          _id: new Types.ObjectId(),
          name: 'Gold',
          baseCurrency: _.parseInt(currency.code('USD').number),
          companyId: new Types.ObjectId(),
          isAvailable: true,
          rateTables: [
            {
              id: new Types.ObjectId(),
              type: RateTableType.CURRENCY_EXCHANGE,
              name: 'exchange-rates.csv',
              baseCurrency: _.parseInt(currency.code('USD').number),
              rows: [
                {
                  name: 'EUR',
                  code: _.parseInt(currency.code('EUR').number),
                  rate: 1.1,
                },
                {
                  name: 'HKD',
                  code: _.parseInt(currency.code('HKD').number),
                  rate: 7.2,
                },
              ],
            },
            {
              id: new Types.ObjectId(),
              name: 'sms-rates.csv',
              type: RateTableType.SMS,
              rows: [
                { name: 'Albania', phoneCode: '355', rate: 2.5 },
                { name: 'Hong Kong', phoneCode: '852', rate: 3.6 },
              ],
            },
            {
              id: new Types.ObjectId(),
              name: 'off-net-call-rates.csv',
              type: RateTableType.OFFNET_CALL,
              rows: [
                {
                  name: 'AFGHANISTAN - Fixed',
                  countryCode: 'AF',
                  phoneNumberType: PhoneNumberType.LANDLINE,
                  phoneCode: '93',
                  rate: 5.8859,
                },
                {
                  name: 'AFGHANISTAN - Mobile',
                  countryCode: 'AF',
                  phoneNumberType: PhoneNumberType.MOBILE,
                  phoneCode: '937',
                  rate: 5.9,
                },
              ],
            },
          ],
        });
        const addedRateTable = new SmsRateTable({
          _id: new Types.ObjectId(),
          name: 'updated-sms-rates.csv',
          rows: [
            { name: 'Albania', phoneCode: '355', rate: 5 },
            { name: 'Hong Kong', phoneCode: '852', rate: 25 },
          ],
        });
        const samples = [billingPlan, addedRateTable];
        const command = {
          ..._.pick(billingPlan, ['baseCurrency', 'isAvailable', 'companyId']),
          billingPlanId: billingPlan.id.toString(),
          name: 'Platinum',
          rateTables: billingPlan.rateTables
            .filter(p => p.type !== RateTableType.SMS)
            .concat([addedRateTable])
            .map(table => ({
              id: table.id.toString(),
              type: table.type,
            })),
        };

        await Promise.all(samples.map(sample => sample.save()));
        const updatedBillingPlan = await billingPlanService.updateBillingPlan(command);

        expect(updatedBillingPlan).to.contain.all.keys(_.omit(command, ['billingPlanId']));
        expect(updatedBillingPlan.updatedAt).to.be.above(billingPlan.updatedAt);
        const storedBillingPlan = await BillingPlan.findById(billingPlan.id);
        const removedTableId = _.find(billingPlan.rateTables, { type: RateTableType.SMS }).id;
        const addedTableId = addedRateTable.id;
        const removedTable = _.find(storedBillingPlan.rateTables, { id: removedTableId });
        const addedTable = _.find(storedBillingPlan.rateTables, { id: addedTableId });
        expect(removedTable).to.not.exist;
        expect(addedTable).to.exist;
        expect(addedTable.toJSON().rows).to.eql(addedRateTable.toJSON().rows);
      }),
    );

    it('throws validation error when updating to another base currency without changing the exchange rate table',
      decorate(async ({ billingPlanService, BillingPlan }) => {
        const billingPlanData = {
          _id: new Types.ObjectId().toString(),
          name: 'Gold',
          baseCurrency: _.parseInt(currency.code('USD').number),
          companyId: new Types.ObjectId().toString(),
          isAvailable: true,
          rateTables: [
            {
              id: new Types.ObjectId(),
              type: RateTableType.CURRENCY_EXCHANGE,
              name: 'exchange-rates.csv',
              baseCurrency: _.parseInt(currency.code('USD').number),
              rows: [
                {
                  name: 'EUR',
                  code: _.parseInt(currency.code('EUR').number),
                  rate: 1.1,
                },
                {
                  name: 'HKD',
                  code: _.parseInt(currency.code('HKD').number),
                  rate: 7.2,
                },
              ],
            },
            {
              id: new Types.ObjectId(),
              name: 'sms-rates.csv',
              type: RateTableType.SMS,
              rows: [
                { name: 'Albania', phoneCode: '355', rate: 2.5 },
                { name: 'Hong Kong', phoneCode: '852', rate: 3.6 },
              ],
            },
            {
              id: new Types.ObjectId(),
              name: 'off-net-call-rates.csv',
              type: RateTableType.OFFNET_CALL,
              rows: [
                {
                  name: 'AFGHANISTAN - Fixed',
                  countryCode: 'AF',
                  phoneNumberType: PhoneNumberType.LANDLINE,
                  phoneCode: '93',
                  rate: 5.8859,
                },
                {
                  name: 'AFGHANISTAN - Mobile',
                  countryCode: 'AF',
                  phoneNumberType: PhoneNumberType.MOBILE,
                  phoneCode: '937',
                  rate: 5.9,
                },
              ],
            },
          ],
        };
        const billingPlan = new BillingPlan(billingPlanData);
        const command = {
          billingPlanId: billingPlan._id.toString(),
          ...billingPlanData,
          baseCurrency: _.parseInt(currency.code('BYR').number),
          rateTables: billingPlan.rateTables.map(table => ({
            id: table.id,
            type: table.type,
          })),
        };

        await billingPlan.save();
        const error = await expect(billingPlanService.updateBillingPlan(command))
          .to.be.rejectedWith(ValidationError);
        expect(error.code).to.be.equal(BillingPlanValidationErrorType.BaseCurrencyMismatch, error.message);
      }));
  });

  describe('getBillingPlan', () => {
    it('returns billing plan from the database', decorate(async ({ billingPlanService, BillingPlan }) => {
      const billingPlan = new BillingPlan({
        _id: new Types.ObjectId(),
        name: 'Gold',
        baseCurrency: _.parseInt(currency.code('USD').number),
        companyId: new Types.ObjectId(),
        isAvailable: true,
        rateTables: [
          {
            id: new Types.ObjectId(),
            type: RateTableType.CURRENCY_EXCHANGE,
            name: 'exchange-rates.csv',
            baseCurrency: _.parseInt(currency.code('USD').number),
            rows: [
              {
                name: 'EUR',
                code: _.parseInt(currency.code('EUR').number),
                rate: 1.1,
              },
              {
                name: 'HKD',
                code: _.parseInt(currency.code('HKD').number),
                rate: 7.2,
              },
            ],
          },
          {
            id: new Types.ObjectId(),
            name: 'sms-rates.csv',
            type: RateTableType.SMS,
            rows: [
              { name: 'Albania', phoneCode: '355', rate: 2.5 },
              { name: 'Hong Kong', phoneCode: '852', rate: 3.6 },
            ],
          },
          {
            id: new Types.ObjectId(),
            name: 'off-net-call-rates.csv',
            type: RateTableType.OFFNET_CALL,
            rows: [
              {
                name: 'AFGHANISTAN - Fixed',
                countryCode: 'AF',
                phoneNumberType: PhoneNumberType.LANDLINE,
                phoneCode: '93',
                rate: 5.8859,
              },
              {
                name: 'AFGHANISTAN - Mobile',
                countryCode: 'AF',
                phoneNumberType: PhoneNumberType.MOBILE,
                phoneCode: '937',
                rate: 5.9,
              },
            ],
          },
        ],
      });
      const query = { billingPlanId: billingPlan.id.toString() };

      await billingPlan.save();
      const plan = await billingPlanService.getBillingPlan(query);
      expect(plan).to.exist;
      expect(plan).to.include.all.keys([
        'id',
        'name',
        'baseCurrency',
        'companyId',
        'isAvailable',
        'createdAt',
        'updatedAt',
        'rateTables',
      ]);
    }));

    it('throws "not found" error when billing plan is not in database', decorate(async ({ billingPlanService }) => {
      const billingPlanId = new Types.ObjectId().toString();
      await expect(billingPlanService.getBillingPlan({ billingPlanId })).to.be.rejectedWith(NotFoundError);
    }));
  });

  describe('removeBillingPlan', () => {
    it('removes billing plan from the database', decorate(async ({ billingPlanService, BillingPlan }) => {
      const billingPlan = new BillingPlan({
        _id: new Types.ObjectId(),
        name: 'Gold',
        baseCurrency: _.parseInt(currency.code('USD').number),
        companyId: new Types.ObjectId(),
        isAvailable: true,
        rateTables: [
          {
            id: new Types.ObjectId(),
            type: RateTableType.CURRENCY_EXCHANGE,
            name: 'exchange-rates.csv',
            baseCurrency: _.parseInt(currency.code('USD').number),
            rows: [
              {
                name: 'EUR',
                code: _.parseInt(currency.code('EUR').number),
                rate: 1.1,
              },
              {
                name: 'HKD',
                code: _.parseInt(currency.code('HKD').number),
                rate: 7.2,
              },
            ],
          },
          {
            id: new Types.ObjectId(),
            name: 'sms-rates.csv',
            type: RateTableType.SMS,
            rows: [
              { name: 'Albania', phoneCode: '355', rate: 2.5 },
              { name: 'Hong Kong', phoneCode: '852', rate: 3.6 },
            ],
          },
          {
            id: new Types.ObjectId(),
            name: 'off-net-call-rates.csv',
            type: RateTableType.OFFNET_CALL,
            rows: [
              {
                name: 'AFGHANISTAN - Fixed',
                countryCode: 'AF',
                phoneNumberType: PhoneNumberType.LANDLINE,
                phoneCode: '93',
                rate: 5.8859,
              },
              {
                name: 'AFGHANISTAN - Mobile',
                countryCode: 'AF',
                phoneNumberType: PhoneNumberType.MOBILE,
                phoneCode: '937',
                rate: 5.9,
              },
            ],
          },
        ],
      });
      const billingPlanId = billingPlan._id.toString();
      await billingPlan.save();

      await billingPlanService.removeBillingPlan({ billingPlanId });
      const storedBillingPlan = await BillingPlan.findById(billingPlanId);
      expect(storedBillingPlan).to.not.exist;
    }));
  });

  describe('getBillingPlans', () => {
    it('returns billing plan page', decorate(async ({ billingPlanService, BillingPlan }) => {
      const names = ['Bronze', 'Silver', 'Gold'];
      const companyId = new Types.ObjectId();
      const billingPlans = names.map(name => new BillingPlan({
        _id: new Types.ObjectId(),
        name,
        baseCurrency: _.parseInt(currency.code('USD').number),
        companyId,
        isAvailable: true,
        rateTables: [
          {
            id: new Types.ObjectId(),
            type: RateTableType.CURRENCY_EXCHANGE,
            name: 'exchange-rates.csv',
            baseCurrency: _.parseInt(currency.code('USD').number),
            rows: [
              {
                name: 'EUR',
                code: _.parseInt(currency.code('EUR').number),
                rate: 1.1,
              },
              {
                name: 'HKD',
                code: _.parseInt(currency.code('HKD').number),
                rate: 7.2,
              },
            ],
          },
          {
            id: new Types.ObjectId(),
            name: 'sms-rates.csv',
            type: RateTableType.SMS,
            rows: [
              { name: 'Albania', phoneCode: '355', rate: 2.5 },
              { name: 'Hong Kong', phoneCode: '852', rate: 3.6 },
            ],
          },
          {
            id: new Types.ObjectId(),
            name: 'off-net-call-rates.csv',
            type: RateTableType.OFFNET_CALL,
            rows: [
              {
                name: 'AFGHANISTAN - Fixed',
                countryCode: 'AF',
                phoneNumberType: PhoneNumberType.LANDLINE,
                phoneCode: '93',
                rate: 5.8859,
              },
              {
                name: 'AFGHANISTAN - Mobile',
                countryCode: 'AF',
                phoneNumberType: PhoneNumberType.MOBILE,
                phoneCode: '937',
                rate: 5.9,
              },
            ],
          },
        ],
      }));
      const query = { pageSize: 5 };

      await Promise.all(billingPlans.map(plan => plan.save()));
      const page = await billingPlanService.getBillingPlans(query);
      expect(page).to.exist;
      expect(page.page).to.equal(1);
      expect(page.pageSize).to.equal(query.pageSize);
      expect(page.items).to.be.an('array');
      expect(page.items).to.have.length(billingPlans.length);
    }));

    it('passes correct query and paging options to model', async () => {
      const BillingPlanStub = {
        find: stub().returns(Promise.resolve([])),
        count: stub().returns(Promise.resolve(0)),
      };
      const billingPlanService = createBillingPlanService({
        RateTable: {},
        SmsRateTable: {},
        ExchangeRateTable: {},
        OffNetCallRateTable: {},
        BillingPlan: BillingPlanStub,
      });

      const sampleId = new Types.ObjectId().toString();
      const sampleSearchQuery = 'Plan A';

      const tests = [
        // One filter
        [
          {
            companyId: sampleId,
          },
          {
            query: {
              $and: [{ companyId: sampleId }],
            },
          },
        ],
        // Two filters
        [
          {
            companyId: sampleId,
            isAvailable: false,
          },
          {
            query: {
              $and: [{
                companyId: sampleId,
                isAvailable: false,
              }],
            },
          },
        ],
        // Two filters and search
        [
          {
            companyId: sampleId,
            isAvailable: true,
            searchQuery: sampleSearchQuery,
          },
          {
            query: {
              $and: [
                {
                  companyId: sampleId,
                  isAvailable: true,
                },
                {
                  $or: [
                    { name: new RegExp(sampleSearchQuery, 'gi') },
                    { description: new RegExp(sampleSearchQuery, 'gi') },
                    { 'rateTables.name': new RegExp(sampleSearchQuery, 'gi') },
                  ],
                },
              ],
            },
          },
        ],
        // Filter and paging
        [
          {
            companyId: sampleId,
            page: 2,
            pageSize: 5,
          },
          {
            query: {
              $and: [{
                companyId: sampleId,
              }],
            },
            options: {
              skip: 5,
              limit: 5,
            },
          },
        ],
      ];

      for (const [input, { query, options }] of tests) {
        await billingPlanService.getBillingPlans(input);
        sinonAssert.calledWith(
          BillingPlanStub.find,
          match(query),
          match.any,
          _.isObject(options) ? match(options) : match.any,
        );
        sinonAssert.calledWith(
          BillingPlanStub.count,
          match(query),
        );
      }
    });
  });

  describe('downloadRateTableFromPlan', () => {
    it('returns file object with matching rate table type', decorate(async ({ billingPlanService, BillingPlan }) => {
      const smsRateTable = {
        id: new Types.ObjectId(),
        name: 'sms-rates.csv',
        type: RateTableType.SMS,
        rows: [
          { name: 'Albania', phoneCode: '355', rate: 2.5 },
          { name: 'Hong Kong', phoneCode: '852', rate: 3.6 },
        ],
      };
      const billingPlan = new BillingPlan({
        _id: new Types.ObjectId(),
        name: 'Gold',
        baseCurrency: _.parseInt(currency.code('USD').number),
        companyId: new Types.ObjectId(),
        isAvailable: true,
        rateTables: [
          {
            id: new Types.ObjectId(),
            type: RateTableType.CURRENCY_EXCHANGE,
            name: 'exchange-rates.csv',
            baseCurrency: _.parseInt(currency.code('USD').number),
            rows: [
              {
                name: 'EUR',
                code: _.parseInt(currency.code('EUR').number),
                rate: 1.1,
              },
              {
                name: 'HKD',
                code: _.parseInt(currency.code('HKD').number),
                rate: 7.2,
              },
            ],
          },
          smsRateTable,
          {
            id: new Types.ObjectId(),
            name: 'off-net-call-rates.csv',
            type: RateTableType.OFFNET_CALL,
            rows: [
              {
                name: 'AFGHANISTAN - Fixed',
                countryCode: 'AF',
                phoneNumberType: PhoneNumberType.LANDLINE,
                phoneCode: '93',
                rate: 5.8859,
              },
              {
                name: 'AFGHANISTAN - Mobile',
                countryCode: 'AF',
                phoneNumberType: PhoneNumberType.MOBILE,
                phoneCode: '937',
                rate: 5.9,
              },
            ],
          },
        ],
      });
      const query = {
        billingPlanId: billingPlan._id.toString(),
        type: RateTableType.SMS,
      };

      await billingPlan.save();
      const file = await billingPlanService.downloadRateTableFromPlan(query);

      expect(file.name).to.equal(smsRateTable.name);
      expect(file.content).to.be.instanceOf(Buffer);
      expect(file.contentType).to.be.equal('text/csv');
      const csv = file.content.toString();
      expect(csv).to.match(/name,phoneCode,rate/);
    }));

    it('throws "not found" error when billing plan is not in database', decorate(async ({ billingPlanService }) => {
      const billingPlanId = new Types.ObjectId().toString();
      const query = {
        billingPlanId,
        type: RateTableType.SMS,
      };
      await expect(billingPlanService.downloadRateTableFromPlan(query)).to.be.rejectedWith(NotFoundError);
    }));
  });
});
