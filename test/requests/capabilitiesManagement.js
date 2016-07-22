import { describe, it } from 'mocha';
import { expect } from 'chai';
import container from '../../src/ioc';

const {
  enableImCapability,
  enableOffnetCapability,
  enableOnnetCapability,
  enablePushCapability,
  enableTopUpCapability,
  enableApiCapability,
  enableVoiceCapability,
  enableSmsCapability,
  enableImToSmsCapability,
} = container.capabilityManagement;

describe('Capabilities Management', () => {
  it('should throw error when essential key is missing', () => (
    // TODO: Check against error type rather than error message
    Promise.all([
      enableImCapability({}).catch(error => expect(error.message).to.equal('"carrierId" is required')),
      enableOffnetCapability({}).catch(error => expect(error.message).to.equal('"carrierId" is required')),
      enableOnnetCapability({}).catch(error => expect(error.message).to.equal('"carrierId" is required')),
      enablePushCapability({}).catch(error => expect(error.message).to.equal('"carrierId" is required')),
      enableTopUpCapability({}).catch(error => expect(error.message).to.equal('"carrierId" is required')),
      enableApiCapability({}).catch(error => expect(error.message).to.equal('"carrierId" is required')),
      enableVoiceCapability({}).catch(error => expect(error.message).to.equal('"carrierId" is required')),
      enableSmsCapability({}).catch(error => expect(error.message).to.equal('"carrierId" is required')),
      enableImToSmsCapability({}).catch(error => expect(error.message).to.equal('"carrierId" is required')),
    ])
  ));

  it('405 Method Not Allowed', () => (
    enableApiCapability({ carrierId: 'example.com' })
      .then(response => {
        expect(response.error).to.exist;
      })
  ));

  it('405 Method Not Allowed', () => (
    enableImToSmsCapability({
      carrierId: 'example.com',
      im_to_sms_profile: {
        attributes: {
          PREFIX: '0000008',
        },
        default_realm: 'WhiteLabel',
        service_plan_id: 'whitelabel',
        systemType: 'testSystem',
        systemId: 'WhiteLabel',
        password: '123@aaI',
      },
    })
      .then(response => {
        expect(response.error).to.exist;
      })
  ));

  it('405 Method Not Allowed', () => (
    enableSmsCapability({
      carrierId: 'example.com',
      sms_profile: {
        attributes: {
          PREFIX: '0000008',
        },
        default_realm: 'WhiteLabel',
        service_plan_id: 'whitelabel',
        systemType: 'testSystem',
        systemId: 'WhiteLabel',
        password: '123@aaI',
      },
    })
      .then(response => {
        expect(response.error).to.exist;
      })
  ));

  it('405 Method Not Allowed', () => (
    enableVoiceCapability({
      carrierId: 'example.com',
      voice_service_profile: {
        is_onnet_charging_disabled: true,
        is_offet_charging_disabled: false,
      },
    })
      .then(response => {
        expect(response.error).to.exist;
      })
  ));

  it('405 Method Not Allowed', () => (
    enableImCapability({ carrierId: 'example.com' })
      .then(response => {
        expect(response.error).to.exist;
      })
  ));

  it('405 Method Not Allowed', () => (
    enableOffnetCapability({ carrierId: 'example.com' })
      .then(response => {
        expect(response.error).to.exist;
      })
  ));

  it('405 Method Not Allowed', () => (
    enableOnnetCapability({ carrierId: 'example.com' })
      .then(response => {
        expect(response.error).to.exist;
      })
  ));

  it('405 Method Not Allowed', () => (
    enablePushCapability({ carrierId: 'example.com' })
      .then(response => {
        expect(response.error).to.exist;
      })
  ));

  it('405 Method Not Allowed', () => (
    enableTopUpCapability({ carrierId: 'example.com' })
      .then(response => {
        expect(response.error).to.exist;
      })
  ));
});
