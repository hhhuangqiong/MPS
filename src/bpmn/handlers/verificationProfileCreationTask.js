import _ from 'lodash';
import { ArgumentNullError, ReferenceError } from 'common-errors';

import { check, createTask, compileJsonTemplate } from './util';
import {
  Capability,
  VerificationMethod,
  CpsCapabilityType,
} from './../../domain';

export function createVerificationProfileCreationTask(
  logger,
  cpsOptions,
  verificationManagement,
  capabilitiesManagement
) {
  check.ok('logger', logger);
  check.ok('cpsOptions', cpsOptions);
  check.ok('verificationManagement', verificationManagement);
  check.ok('capabilitiesManagement', capabilitiesManagement);

  const { template } = cpsOptions.verification;

  function validateRerun(profile, taskResult) {
    if (taskResult.verificationProfileId) {
      // skip on rerun
      return false;
    }

    return true;
  }

  const VerificationCapabilities = [
    Capability.VERIFICATION_MO,
    Capability.VERIFICATION_MT,
    Capability.VERIFICATION_SMS,
    Capability.VERIFICATION_IVR,
  ];

  function needActivation(capabilities) {
    return _.intersection(capabilities, VerificationCapabilities).length > 0;
  }

  function generateVerificationMethods(capabilities) {
    const verificationCapabilities = _.intersection(capabilities, VerificationCapabilities);
    return _.map(verificationCapabilities, (capability) => {
      switch (capability) {
        case Capability.VERIFICATION_IVR:
          return VerificationMethod.IVR;
        case Capability.VERIFICATION_MO:
          return VerificationMethod.MO;
        case Capability.VERIFICATION_MT:
          return VerificationMethod.MT;
        case Capability.VERIFICATION_SMS:
          return VerificationMethod.SMS;
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
    return capabilitiesManagement.getProfile(carrierId, CpsCapabilityType.SMS)
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
    if (_.includes(capabilities, Capability.VERIFICATION_SMS)) {
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

      return verificationManagement.saveProfile(carrierId, profile);
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

  return createTask('VERIFICATION_PROFILE_CREATION', run, { validateRerun }, logger);
}

export default createVerificationProfileCreationTask;

