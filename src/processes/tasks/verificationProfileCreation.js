import _ from 'lodash';
import { ArgumentNullError, ReferenceError } from 'common-errors';

import ioc from '../../ioc';
import logger from '../../utils/logger';
import { createTask } from '../util/task';
import { Capabilities } from '../../models/Provisioning';
import { compileJsonTemplate } from '../../utils/nconf';

const { CapabilitiesManagement, VerificationManagement, cpsConfig } = ioc.container;
const { VerificationMethods } = VerificationManagement.constructor;
const { template } = cpsConfig.verification;
const { CapabilityTypeToIds } = CapabilitiesManagement.constructor;

function validateRerun(profile, taskResult) {
  if (taskResult.verificationProfileId) {
    // skip on rerun
    return false;
  }

  return true;
}

const VerificationCapabilities = [
  Capabilities.VERIFICATION_MO,
  Capabilities.VERIFICATION_MT,
  Capabilities.VERIFICATION_SMS,
  Capabilities.VERIFICATION_IVR,
];

function needActivation(capabilities) {
  return _.intersection(capabilities, VerificationCapabilities).length > 0;
}

function generateVerificationMethods(capabilities) {
  const verificationCapabilities = _.intersection(capabilities, VerificationCapabilities);
  return _.map(verificationCapabilities, (capability) => {
    switch (capability) {
      case Capabilities.VERIFICATION_IVR:
        return VerificationMethods.IVR;
      case Capabilities.VERIFICATION_MO:
        return VerificationMethods.MO;
      case Capabilities.VERIFICATION_MT:
        return VerificationMethods.MT;
      case Capabilities.VERIFICATION_SMS:
        return VerificationMethods.SMS;
      default:
        return undefined;
    }
  });
}

function generateVerificationProfile(data) {
  const { capabilities } = data;
  const verificationMethods = generateVerificationMethods(capabilities);
  const profile = compileJsonTemplate(template, _.extend({}, data));
  profile.enabled_verification_methods = verificationMethods;
  return profile;
}

function getSmsProfileIdentifier(carrierId) {
  return CapabilitiesManagement.getProfile(carrierId, CapabilityTypeToIds.SMS)
    .then((res) => {
      const { identifier } = res.body;

      if (!identifier) {
        throw new ReferenceError('Unexpected response from CPS: `identifier` missing in sms profile');
      }

      return identifier;
    });
}

function run(data, cb) {
  const { carrierId, capabilities } = data;

  if (!needActivation(capabilities)) {
    logger.info('Verification Profile Creation skipped no capabilities requires.');
    cb(null, { done: false });
    return;
  }

  if (!carrierId) {
    cb(new ArgumentNullError('carrierId'));
    return;
  }

  let prepareData;
  if (_.includes(capabilities, Capabilities.VERIFICATION_SMS)) {
    prepareData = getSmsProfileIdentifier(carrierId)
      .then((smsProfileIdentifier) => {
        if (!smsProfileIdentifier) throw new ArgumentNullError('smsProfileIdentifier');
        return _.extend({}, data, { smsProfileIdentifier });
      });
  } else {
    prepareData = Promise.resolve(data);
  }

  prepareData.then((preparedData) => {
    const profile = generateVerificationProfile(preparedData);

    return VerificationManagement.saveProfile(carrierId, profile);
  })
  .then(response => {
    const { id: verificationProfileId } = response.body;

    if (!verificationProfileId) {
      throw new ReferenceError('id not defined in response from carrier profile creation');
    }

    cb(null, { verificationProfileId });
  })
  .catch(cb);
}

export default createTask('VERIFICATION_PROFILE_CREATION', run, { validateRerun });
