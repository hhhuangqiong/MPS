import sinon from 'sinon';
import { expect } from 'chai';
import { ArgumentError, NotImplementedError, ValidationError, HttpStatusError } from 'common-errors';
import { createCarrierCreationTask, bpmnEvents } from '../../../src/bpmn';
import { Logger } from 'winston';
import { ServiceType } from '../../../src/domain';

describe('bpmn/handlers/carrierCreationTask', () => {
  it('throws ArgumentError when any of dependencies is not provided', () => {
    const carrierManagement = {};
    const templateService = {};
    expect(() => createCarrierCreationTask(null, carrierManagement)).to.throw(ArgumentError);
    expect(() => createCarrierCreationTask(templateService, null)).to.throw(ArgumentError);
  });
  it('should return a function which name is CARRIER_CREATION', () => {
    const templateService = {};
    const carrierManagement = {};
    const result = createCarrierCreationTask(templateService, carrierManagement);
    expect(result.$meta.name).to.equal(bpmnEvents.CARRIER_CREATION);
  });
  describe('createCarrierTask', () => {
    it('throws NotImplementedError when the serviceType is Live-Connect', async () => {
      const context = {
        logger: {},
      };
      const profile = {
        serviceType: ServiceType.LIVE_CONNECT,
      };
      const state = {
        results: {
          carrierId: null,
        },
      };
      const templateService = {};
      const carrierManagement = {};
      const createCarrierTask = createCarrierCreationTask(templateService, carrierManagement);
      let errorThrown = false;
      try {
        await createCarrierTask(state, profile, context);
      } catch (err) {
        expect(err).to.be.instanceOf(NotImplementedError);
        errorThrown = true;
      }
      expect(errorThrown).to.be.true;
    });
  });
  it('throws ReferenceError when the carrierId is empty returned by server', async () => {
    const context = {
      logger: new Logger(),
    };
    const profile = {
      serviceType: ServiceType.WHITE_LABEL,
    };
    const state = {
      results: {
        carrierId: null,
      },
    };
    const cpsOptions = {
      wlServiceDomain: 'maaii.com',
      sdkServiceDomain: 'm800-api.com',
    };
    const paramsToCreateCarrier = {
      identifier: 'test176.m800-api.com',
      partnership_restrictiveness: 'WHITE_LIST',
    };
    const templateService = {
      get: sinon.stub().returns(cpsOptions),
      render: sinon.stub().returns(paramsToCreateCarrier),
    };
    const resCarrier = {
      body: { id: null },
    };
    const carrierManagement = {
      createCarrier: sinon.stub().returns(resCarrier),
      errorNames: {
        CARRIER_ALREADY_EXISTS: '',
      },
    };
    const createCarrierTask = createCarrierCreationTask(templateService, carrierManagement);
    let errorThrown = false;
    try {
      await createCarrierTask(state, profile, context);
    } catch (err) {
      expect(err).to.be.instanceOf(ReferenceError);
      errorThrown = true;
    }
    expect(errorThrown).to.be.true;
  });
  it('returns carrierId if the task is success', async () => {
    const context = {
      logger: new Logger(),
    };
    const profile = {
      serviceType: ServiceType.WHITE_LABEL,
    };
    const state = {
      results: {
        carrierId: null,
      },
    };
    const cpsOptions = {
      wlServiceDomain: 'maaii.com',
      sdkServiceDomain: 'm800-api.com',
    };
    const paramsToCreateCarrier = {
      identifier: 'test176.m800-api.com',
      partnership_restrictiveness: 'WHITE_LIST',
    };
    const templateService = {
      get: sinon.stub().returns(cpsOptions),
      render: sinon.stub().returns(paramsToCreateCarrier),
    };
    const resCarrier = {
      body: { id: '123456' },
    };
    const carrierManagement = {
      createCarrier: sinon.stub().returns(resCarrier),
      errorNames: {
        CARRIER_ALREADY_EXISTS: '',
      },
    };
    const createCarrierTask = createCarrierCreationTask(templateService, carrierManagement);
    const result = await createCarrierTask(state, profile, context);
    expect(result.results.carrierId).to.be.equal(resCarrier.body.id);
  });
  it('return the user validation error when user error occurs', async () => {
    const context = {
      logger: new Logger(),
    };
    const profile = {
      serviceType: ServiceType.SDK,
    };
    const state = {
      results: {
        carrierId: null,
      },
    };
    const cpsOptions = {
      wlServiceDomain: 'maaii.com',
      sdkServiceDomain: 'm800-api.com',
    };
    const paramsToCreateCarrier = {
      identifier: 'test176.m800-api.com',
      partnership_restrictiveness: 'WHITE_LIST',
    };
    const templateService = {
      get: sinon.stub().returns(cpsOptions),
      render: sinon.stub().returns(paramsToCreateCarrier),
    };
    const userError = new ValidationError(
      'Provisioning validation failed',
      'ValidationError',
      'Company.profile',
    );
    const carrierManagement = {
      createCarrier: sinon.stub().throws(userError),
      errorNames: {
        CARRIER_ALREADY_EXISTS: 'ValidationError',
      },
    };
    const resUserError = [{
      message: 'Provisioning validation failed',
      name: 'ValidationError',
      code: 'ValidationError',
      path: 'profile.companyCode',
    }];
    const createCarrierTask = createCarrierCreationTask(templateService, carrierManagement);
    const error = await createCarrierTask(state, profile, context);
    expect(error.errors).to.be.deep.equal(resUserError);
  });
  it('throws the user validation error when its code is different with carrierManagement errorNames ', async () => {
    const context = {
      logger: new Logger(),
    };
    const profile = {
      serviceType: ServiceType.SDK,
    };
    const state = {
      results: {
        carrierId: null,
      },
    };
    const cpsOptions = {
      wlServiceDomain: 'maaii.com',
      sdkServiceDomain: 'm800-api.com',
    };
    const paramsToCreateCarrier = {
      identifier: 'test176.m800-api.com',
      partnership_restrictiveness: 'WHITE_LIST',
    };
    const templateService = {
      get: sinon.stub().returns(cpsOptions),
      render: sinon.stub().returns(paramsToCreateCarrier),
    };
    const userError = new ValidationError(
      'Provisioning validation failed',
      'ValidationError',
      'Company.profile',
    );
    const carrierManagement = {
      createCarrier: sinon.stub().throws(userError),
      errorNames: {
        CARRIER_ALREADY_EXISTS: 'user undefined',
      },
    };
    const createCarrierTask = createCarrierCreationTask(templateService, carrierManagement);
    let errorThrown = false;
    try {
      await createCarrierTask(state, profile, context);
    } catch (err) {
      expect(err).to.be.instanceOf(ValidationError);
      errorThrown = true;
    }
    expect(errorThrown).to.be.true;
  });

  it('throws error when other types of error occurs', async () => {
    const context = {
      logger: new Logger(),
    };
    const profile = {
      serviceType: ServiceType.SDK,
    };
    const state = {
      results: {
        carrierId: null,
      },
    };
    const cpsOptions = {
      wlServiceDomain: 'maaii.com',
      sdkServiceDomain: 'm800-api.com',
    };
    const paramsToCreateCarrier = {
      identifier: 'test176.m800-api.com',
      partnership_restrictiveness: 'WHITE_LIST',
    };
    const templateService = {
      get: sinon.stub().returns(cpsOptions),
      render: sinon.stub().returns(paramsToCreateCarrier),
    };
    const httpError = new HttpStatusError(404, 'Not Found');
    const carrierManagement = {
      createCarrier: sinon.stub().throws(httpError),
      errorNames: {
        CARRIER_ALREADY_EXISTS: 'user undefined',
      },
    };
    const createCarrierTask = createCarrierCreationTask(templateService, carrierManagement);
    let errorThrown = false;
    try {
      await createCarrierTask(state, profile, context);
    } catch (err) {
      expect(err).to.be.instanceOf(HttpStatusError);
      errorThrown = true;
    }
    expect(errorThrown).to.be.true;
  });
});
