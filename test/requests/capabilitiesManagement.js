import { describe, it } from 'mocha';
import { expect } from 'chai';

import {
  expectOk,
  expectNotExist,
  missingRequiredField,
} from '../expectValidator';

import CapabilitiesManagement from '../../src/requests/CapabilitiesManagement';
const capabilitiesManagement = new CapabilitiesManagement('http://192.168.118.23:9000');

describe('Capabilities Management', () => {
  it('should throw error when essential key is missing', () => (
    // TODO: Check against error type rather than error message
    Promise.all([
      capabilitiesManagement.enableCapabilityByType('im', {}),
      capabilitiesManagement.enableApiCapability({}),
      capabilitiesManagement.enableVoiceCapability({}),
      capabilitiesManagement.enableSmsCapability({}),
      capabilitiesManagement.enableImToSmsCapability({}),
    ])
      .then(expectNotExist)
      .catch(missingRequiredField('carrierId'))
  ));

  it('should response correctly for API Capability', () => (
    capabilitiesManagement.enableApiCapability({
      carrierId: 'example.com',
      developer: {},
    })
      .then(result => expect(result.body.id).to.exist)
      .catch(expectNotExist)
  ));

  // pass from routing profile
  it('should response correctly for Voice Capability', () => (
    capabilitiesManagement.enableVoiceCapability({
      carrierId: 'example.com',
      is_onnet_charging_disabled: true,
      is_offet_charging_disabled: false,
      /*
       * Required: true
       * Description: Routing profile id. It should be prepared by asking the Voice Engineer to create it using MSS CLI.
       */
      // routing_profile_id: value,
    })
      .then(result => expect(result.body.id).to.be.true)
      .catch(expectNotExist)
  ));

  xit('should response correctly for SMS Capability', () => (
    capabilitiesManagement.enableSmsCapability({
      carrierId: 'example.com',
      default_realm: 'WhiteLabel',
      service_plan_id: 'whitelabel',
      systemType: 'testSystem',
      systemId: 'WhiteLabel',
      password: '123@aaI',
    })
      .then(result => expect(result.body.id).to.exist)
      .catch(expectNotExist)
  ));

  it('should response correctly for IM to SMS Capability', () => (
    capabilitiesManagement.enableImToSmsCapability({
      carrierId: 'example.com',
      default_realm: 'WhiteLabel',
      service_plan_id: 'whitelabel',
      systemType: 'testSystem',
      systemId: 'WhiteLabel',
      password: '123@aaI',
    })
      .then(result => expect(result.body.id).to.be.true)
      .catch(expectNotExist)
  ));

  xit('should response 200 for IM Capability', () => (
    capabilitiesManagement.enableCapabilityByType('im', { carrierId: 'example.com' })
      .then(result => expect(result.body.id).to.be.true)
      .catch(expectNotExist)
  ));

  xit('should response 200 form Offnet Capability', () => (
    capabilitiesManagement.enableCapabilityByType('offnet', { carrierId: 'example.com' })
      .then(expectOk)
      .catch(expectNotExist)
  ));

  xit('should response 200 form Onnet Capability', () => (
    capabilitiesManagement.enableCapabilityByType('onnet', { carrierId: 'example.com' })
      .then(expectOk)
      .catch(expectNotExist)
  ));

  xit('should response 200 form Push Capability', () => (
    capabilitiesManagement.enableCapabilityByType('push', { carrierId: 'example.com' })
      .then(expectOk)
      .catch(expectNotExist)
  ));

  xit('should response 200 form Topup Capability', () => (
    capabilitiesManagement.enableCapabilityByType('topup', { carrierId: 'example.com' })
      .then(expectOk)
      .catch(expectNotExist)
  ));
});
