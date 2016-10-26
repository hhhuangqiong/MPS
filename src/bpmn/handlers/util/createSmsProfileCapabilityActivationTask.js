import _ from 'lodash';
import { ReferenceError, ArgumentNullError } from 'common-errors';

import { check, createTask, compileJsonTemplate } from './';

export function createSmsProfileCapabilityActivationTask(
  logger,
  cpsOptions,
  capabilitiesManagement,
  { taskName, profileCapability, requestCapabilityType, template },
) {
  check.ok('logger', logger);
  check.ok('cpsOptions', cpsOptions);
  check.ok('capabilitiesManagement', capabilitiesManagement);
  check.predicate('options', taskName, _.isString, 'Task name should be a string');


  function validateRerun(profile, taskResult) {
    if (taskResult.done) {
      // already enabled, skip
      return false;
    }

    return true;
  }

  function needActivation(capabilities) {
    if (!_.isArray(profileCapability)) {
      profileCapability = [profileCapability];
    }
    return _.intersection(capabilities, profileCapability).length > 0;
  }

  function run(data, cb) {
    const { carrierId, capabilities, smsc } = data;

    if (!needActivation(capabilities)) {
      cb(null, { done: false });
      return;
    }

    const chargeProfiles = {
      companyChargeProfile: cpsOptions.chargeProfile.company,
      userChargeProfile: cpsOptions.chargeProfile.user,
    };

    const smsProfile = compileJsonTemplate(template, _.extend(data, chargeProfiles));

    if (!smsc) {
      throw new ArgumentNullError('smsc');
    } else {
      // sms profile for
      smsProfile.attributes = {
        PREFIX: '',
      };
      smsProfile.default_realm = smsc.defaultRealm;
      smsProfile.service_plan_id = smsc.servicePlanId;
      smsProfile.source_address_list = [{ as_number: smsc.sourceAddress }];
    }

    capabilitiesManagement.enableSmsProfileCapability(requestCapabilityType, carrierId, smsProfile)
      .then(res => {
        const { id: smsProfileId } = res.body;

        if (!smsProfileId) {
          throw new ReferenceError('Unexpected response from CPS sms activation: id missing');
        }

        cb(null, { done: smsProfileId });
      })
      .catch(cb);
  }

  return createTask(taskName, run, { validateRerun }, logger);
}

export default createSmsProfileCapabilityActivationTask;
