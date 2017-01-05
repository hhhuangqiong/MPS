import chai, { expect } from 'chai';
import sinon from 'sinon';
import chaiPromised from 'chai-as-promised';
import { ArgumentNullError, ReferenceError, ArgumentError } from 'common-errors';

import { createUserCarrierProfileCreationTask, bpmnEvents } from '../../../src/bpmn';

chai.use(chaiPromised);

describe('bpmn/handlers/createUserCarrierProfileCreationTask', () => {
  it('throws ArgumentError when carrierManagement is not provided', () => {
    expect(createUserCarrierProfileCreationTask).to.throw(ArgumentError);
  });

  it('returns a function which name is USER_CARRIER_PROFILE_CREATION', () => {
    const userCarrierProfileCreationTask = createUserCarrierProfileCreationTask({});
    expect(userCarrierProfileCreationTask.$meta.name).to.equal(bpmnEvents.USER_CARRIER_PROFILE_CREATION);
  });

  it('throws ArgumentNullError when no carrierId in state', async () => {
    const userCarrierProfileCreationTask = createUserCarrierProfileCreationTask({});
    const state = {
      results: {},
    };
    await expect(userCarrierProfileCreationTask(state)).to.be.rejectedWith(ArgumentNullError);
  });

  it('creates user carrier profile', async () => {
    const createUserCarrierProfileResponse = {
      body: {
        id: 'userCarrierProfileId',
      },
    };
    const carrierManagement = {
      createUserCarrierProfile: sinon.stub().returns(createUserCarrierProfileResponse),
    };
    const state = {
      results: {
        carrierId: 'carrierId',
      },
    };
    const userCarrierProfileCreationTask = createUserCarrierProfileCreationTask(carrierManagement);
    const res = await userCarrierProfileCreationTask(state);
    expect(res.results.userCarrierProfileId).to.equal(createUserCarrierProfileResponse.body.id);
    expect(carrierManagement.createUserCarrierProfile.calledOnce).to.be.true;
  });

  it('throws ReferenceError when receiving incorrect response from user carrier profile creation', async () => {
    const incorrectCreateUserCarrierProfileResponse = {
      body: {},
    };
    const carrierManagement = {
      createUserCarrierProfile: sinon.stub().returns(incorrectCreateUserCarrierProfileResponse),
    };
    const state = {
      results: {
        carrierId: 'carrierId',
      },
    };
    const userCarrierProfileCreationTask = createUserCarrierProfileCreationTask(carrierManagement);
    await expect(userCarrierProfileCreationTask(state)).to.be.rejectedWith(ReferenceError);
    expect(carrierManagement.createUserCarrierProfile.calledOnce).to.be.true;
  });
});
