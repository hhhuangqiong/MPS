import _ from 'lodash';
import { ReferenceError, NotImplementedError } from 'common-errors';

import ioc from '../../../ioc';
import { createTask } from '../../util/task';
import { compileJsonTemplate } from '../../../utils/nconf';

const { cpsConfig, CapabilitiesManagement } = ioc.container;

export default function ({ taskName, profileCapability, requestCapabilityType, template }) {
  function rerunValidation(profile, taskResult) {
    if (taskResult.done) {
      // already enabled, skip
      return false;
    }

    return true;
  }

  function needActivation(capabilities) {
    return _.intersection(capabilities, profileCapability).length > 0;
  }

  function run(data, cb) {
    const { carrierId, capabilities, smsc } = data;

    if (!needActivation(capabilities)) {
      cb(null, { done: false });
      return;
    }

    const chargeProfiles = {
      companyChargeProfile: cpsConfig.chargeProfile.company,
      userChargeProfile: cpsConfig.chargeProfile.user,
    };

    const smsProfile = compileJsonTemplate(template, _.extend(data, chargeProfiles));

    if (!smsc) {
      throw new NotImplementedError('Default smsc not supported yet');
    } else {
      // sms profile for
      smsProfile.attributes = {
        PREFIX: '',
      };
      smsProfile.default_realm = smsc.defaultRealm;
      smsProfile.service_plan_id = smsc.servicePlanId;
      smsProfile.source_address_list = [{ as_number: smsc.sourceAddress }];
    }

    CapabilitiesManagement.enableSmsProfileCapability(requestCapabilityType, carrierId, smsProfile)
      .then(res => {
        const { id: smsProfileId } = res.body;

        if (!smsProfileId) {
          throw new ReferenceError('Unexpected response from CPS sms activation: id missing');
        }

        cb(null, { done: smsProfileId });
      })
      .catch(cb);
  }

  return createTask(taskName, run, { rerunValidation });
}
