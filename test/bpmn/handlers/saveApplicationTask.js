import chai, { expect } from 'chai';
import sinon from 'sinon';
import { ArgumentError, NotImplementedError, IncompleteResultError } from 'common-errors';
import chaiPromised from 'chai-as-promised';

import { Capability, ServiceType } from '../../../src/domain';
import { createSaveApplicationTask, bpmnEvents } from '../../../src/bpmn';

chai.use(chaiPromised);

describe('bpmn/handlers/createSaveApplicationTask', () => {
  it('throws ArgumentError when any of dependencies is not provided', () => {
    const applicationManagement = {};
    const templateService = {};
    const inputs = [
      [null, applicationManagement],
      [templateService, null],
    ];
    inputs.forEach(args => {
      expect(() => createSaveApplicationTask(...args)).to.throw(ArgumentError);
    });
  });

  it('returns a function which name is SAVE_APPLICATION', () => {
    const saveApplicationTask = createSaveApplicationTask({}, {});
    expect(saveApplicationTask.$meta.name).to.equal(bpmnEvents.SAVE_APPLICATION);
  });

  it('returns null when no platform capabiities in profile', async () => {
    const applicationManagement = {
      saveApplication: sinon.stub(),
    };
    const templateService = {};
    const saveApplicationTask = createSaveApplicationTask(templateService, applicationManagement);

    const state = {
      results: {
        featureSetIdentifier: 'carrierId.feature-set',
        developerId: '58512b1e46e0fb000113963c',
        applications: [],
      },
    };
    const profile = {
      companyCode: 'companyCode',
      serviceType: ServiceType.WHITE_LABEL,
      capabilities: [Capability.IM],
    };
    await expect(saveApplicationTask(state, profile)).to.be.fulfilled;
    expect(applicationManagement.saveApplication.called).to.be.false;
  });

  it('throws IncompleteResultError when no applicationVersion in template', async () => {
    const applicationManagement = {
      saveApplication: sinon.stub(),
    };
    const cpsOption = {
      wlServiceDomain: 'maaii.com',
      sdkServiceDomain: 'm800-api.com',
    };
    const templateService = {
      get: sinon.stub().returns(cpsOption),
    };
    const saveApplicationTask = createSaveApplicationTask(templateService, applicationManagement);

    const state = {
      results: {
        featureSetIdentifier: 'carrierId.feature-set',
        developerId: '58512b1e46e0fb000113963c',
        applications: [],
      },
    };
    const profile = {
      companyCode: 'companyCode',
      serviceType: ServiceType.WHITE_LABEL,
      capabilities: [Capability.PLATFORM_WEB, Capability.PLATFORM_ANDROID, Capability.PLATFORM_IOS],
    };
    await expect(saveApplicationTask(state, profile)).to.be.rejectedWith(IncompleteResultError);
    expect(applicationManagement.saveApplication.called).to.be.false;
    expect(templateService.get.calledOnce).to.be.true;
  });

  it('throws IncompleteResultError when no featureSetIdentifier in state', async () => {
    const applicationManagement = {
      saveApplication: sinon.stub(),
    };
    const cpsOption = {
      wlServiceDomain: 'maaii.com',
      sdkServiceDomain: 'm800-api.com',
      applicationVersion: {
        version_numbers: {
          version_major: 1,
          version_minor: 0,
          version_patch: 0,
        },
        version_status: 'RELEASED',
      },
    };
    const templateService = {
      get: sinon.stub().returns(cpsOption),
    };
    const saveApplicationTask = createSaveApplicationTask(templateService, applicationManagement);

    const state = {
      results: {
        developerId: '58512b1e46e0fb000113963c',
        applications: [],
      },
    };
    const profile = {
      companyCode: 'companyCode',
      serviceType: ServiceType.WHITE_LABEL,
      capabilities: [Capability.PLATFORM_WEB, Capability.PLATFORM_ANDROID, Capability.PLATFORM_IOS],
    };
    await expect(saveApplicationTask(state, profile)).to.be.rejectedWith(IncompleteResultError);
    expect(applicationManagement.saveApplication.called).to.be.false;
    expect(templateService.get.calledOnce).to.be.true;
  });

  it('throws NotImplementedError when not supported service type in profile', async () => {
    const applicationManagement = {
      saveApplication: sinon.stub(),
    };
    const cpsOption = {
      wlServiceDomain: 'maaii.com',
      sdkServiceDomain: 'm800-api.com',
      applicationVersion: {
        version_numbers: {
          version_major: 1,
          version_minor: 0,
          version_patch: 0,
        },
        version_status: 'RELEASED',
      },
    };
    const templateService = {
      get: sinon.stub().returns(cpsOption),
    };
    const saveApplicationTask = createSaveApplicationTask(templateService, applicationManagement);

    const state = {
      results: {
        featureSetIdentifier: 'carrierId.feature-set',
        developerId: '58512b1e46e0fb000113963c',
        applications: [],
      },
    };
    const profile = {
      companyCode: 'companyCode',
      serviceType: 'unexpectedServiceType',
      capabilities: [Capability.PLATFORM_WEB, Capability.PLATFORM_ANDROID, Capability.PLATFORM_IOS],
    };
    await expect(saveApplicationTask(state, profile)).to.be.rejectedWith(NotImplementedError);
    expect(applicationManagement.saveApplication.called).to.be.false;
    expect(templateService.get.calledOnce).to.be.true;
  });

  it('throws IncompleteResultError when incorrect response from applicationManagement saveApplication', async () => {
    const applicationManagement = {
      saveApplication: sinon.stub().returns({ body: {} }),
    };
    const cpsOption = {
      wlServiceDomain: 'maaii.com',
      sdkServiceDomain: 'm800-api.com',
      applicationVersion: {
        version_numbers: {
          version_major: 1,
          version_minor: 0,
          version_patch: 0,
        },
        version_status: 'RELEASED',
      },
    };
    const templateService = {
      get: sinon.stub().returns(cpsOption),
    };
    const saveApplicationTask = createSaveApplicationTask(templateService, applicationManagement);

    const state = {
      results: {
        featureSetIdentifier: 'carrierId.feature-set',
        developerId: '58512b1e46e0fb000113963c',
        applications: [],
      },
    };
    const profile = {
      companyCode: 'companyCode',
      serviceType: ServiceType.WHITE_LABEL,
      capabilities: [Capability.PLATFORM_WEB, Capability.PLATFORM_ANDROID, Capability.PLATFORM_IOS],
    };
    await expect(saveApplicationTask(state, profile)).to.be.rejectedWith(IncompleteResultError);
    expect(applicationManagement.saveApplication.calledOnce).to.be.true;
  });

  it('skips save application when applicationIdentifier was created', async () => {
    const applicationManagement = {
      saveApplication: sinon.stub(),
    };
    const templateService = {
      get: sinon.stub(),
    };
    const saveApplicationTask = createSaveApplicationTask(templateService, applicationManagement);

    const state = {
      results: {
        featureSetIdentifier: 'carrierId.feature-set',
        developerId: '58512b1e46e0fb000113963c',
        applications: [],
        applicationIdentifier: 'applicationIdentifier',
      },
    };
    const profile = {
      companyCode: 'companyCode',
      serviceType: ServiceType.WHITE_LABEL,
      capabilities: [Capability.PLATFORM_ANDROID],
    };
    const res = await saveApplicationTask(state, profile);
    expect(res).to.be.null;
    expect(templateService.get.called).to.be.false;
    expect(applicationManagement.saveApplication.called).to.be.false;
  });

  it('saves application when there are multiple platform capabilities with white label service type', async () => {
    const applicationManagement = {
      saveApplication: () => {},
    };
    const saveApplicationStub = sinon.stub(applicationManagement, 'saveApplication',
      param => ({
        body: {
          id: param.identifier,
        },
      }));
    const cpsOption = {
      wlServiceDomain: 'maaii.com',
      sdkServiceDomain: 'm800-api.com',
      applicationVersion: {
        version_numbers: {
          version_major: 1,
          version_minor: 0,
          version_patch: 0,
        },
        version_status: 'RELEASED',
      },
    };
    const templateService = {
      get: sinon.stub().returns(cpsOption),
    };
    const saveApplicationTask = createSaveApplicationTask(templateService, applicationManagement);

    const state = {
      results: {
        featureSetIdentifier: 'carrierId.feature-set',
        developerId: '58512b1e46e0fb000113963c',
        applications: [],
      },
    };
    const profile = {
      companyCode: 'companyCode',
      serviceType: ServiceType.WHITE_LABEL,
      capabilities: [Capability.PLATFORM_WEB, Capability.PLATFORM_ANDROID, Capability.PLATFORM_IOS],
    };
    const res = await saveApplicationTask(state, profile);
    expect(saveApplicationStub.callCount).to.equal(profile.capabilities.length);
    saveApplicationStub.args.forEach(args => {
      const params = args[0];
      expect(params).to.contain.all.keys(['identifier', 'name', 'application_versions',
       'platform', 'application_key', 'application_secret']);
      expect(params).to.have.property('status', 'ACTIVE');
      expect(params).to.have.property('developer', state.results.developerId);
    });
    expect(templateService.get.calledOnce).to.be.true;
    expect(res.results.applicationIdentifier).to.contain('com.maaii');
    expect(res.results.applications).to.have.lengthOf(profile.capabilities.length);
    res.results.applications.forEach(application => {
      expect(application.platform).to.exist;
      expect(application.app.applicationId).to.exist;
      expect(application.app.applicationKey).to.exist;
      expect(application.app.applicationSecret).to.exist;
    });
  });

  it('saves application when there are multiple platform capabilities with sdk service type', async () => {
    const applicationManagement = {
      saveApplication: () => {},
    };
    const saveApplicationStub = sinon.stub(applicationManagement, 'saveApplication',
      param => ({
        body: {
          id: param.identifier,
        },
      }));
    const cpsOption = {
      wlServiceDomain: 'maaii.com',
      sdkServiceDomain: 'm800-api.com',
      applicationVersion: {
        version_numbers: {
          version_major: 1,
          version_minor: 0,
          version_patch: 0,
        },
        version_status: 'RELEASED',
      },
    };
    const templateService = {
      get: sinon.stub().returns(cpsOption),
    };
    const saveApplicationTask = createSaveApplicationTask(templateService, applicationManagement);

    const state = {
      results: {
        featureSetIdentifier: 'carrierId.feature-set',
        developerId: '58512b1e46e0fb000113963c',
        applications: [],
      },
    };
    const profile = {
      companyCode: 'companyCode',
      serviceType: ServiceType.SDK,
      capabilities: [Capability.PLATFORM_WEB, Capability.PLATFORM_ANDROID, Capability.PLATFORM_IOS],
    };
    const res = await saveApplicationTask(state, profile);
    expect(saveApplicationStub.callCount).to.equal(profile.capabilities.length);
    saveApplicationStub.args.forEach(args => {
      const params = args[0];
      expect(params).to.contain.all.keys(['identifier', 'name', 'application_versions',
       'platform', 'application_key', 'application_secret']);
      expect(params).to.have.property('status', 'ACTIVE');
      expect(params).to.have.property('developer', state.results.developerId);
    });
    expect(templateService.get.calledOnce).to.be.true;
    expect(res.results.applicationIdentifier).to.contain('com.m800-api');
    expect(res.results.applications).to.have.lengthOf(profile.capabilities.length);
    res.results.applications.forEach(application => {
      expect(application.platform).to.exist;
      expect(application.app.applicationId).to.exist;
      expect(application.app.applicationKey).to.exist;
      expect(application.app.applicationSecret).to.exist;
    });
  });
});
