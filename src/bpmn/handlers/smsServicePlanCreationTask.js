import { ArgumentNullError, ReferenceError } from 'common-errors';

import { check } from './../../util';
import { SMS_SERVICE_PLAN_CREATION } from './bpmnEvents';

export function createSmsServicePlanCreationTask(templateService, smsServicePlanManagement) {
  check.ok('templateService', templateService);
  check.ok('smsServicePlanManagement', smsServicePlanManagement);

  async function createSmsServicePlan(state, profile) {
    if (state.results.smsServicePlanId) {
      return null;
    }

    const { carrierId } = state.results;
    if (!carrierId) {
      throw new ArgumentNullError('carrierId');
    }

    const { smsc } = profile;

    // if servicePlan is mentioned, no need to create sms servicePlan
    if (smsc.servicePlanId) {
      return null;
    }

    const templateParams = { carrierId };
    const servicePlan = await templateService.render('cps.smsServicePlan', templateParams);

    const response = await smsServicePlanManagement.create(servicePlan);
    const { id: smsServicePlanId } = response.body;
    if (!smsServicePlanId) {
      throw new ReferenceError('id not defined in response from sms service plan creation');
    }
    return {
      results: {
        smsServicePlanId,
      },
    };
  }

  createSmsServicePlan.$meta = {
    name: SMS_SERVICE_PLAN_CREATION,
  };

  return createSmsServicePlan;
}

export default createSmsServicePlanCreationTask;
