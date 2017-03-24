import {
  presetController,
  provisioningController,
  billingPlanController,
  rateTableController,
} from './controllers';
import createErrorMiddleware from './errorMiddleware';
import api from './api';

export function register(container) {
  container.service('PresetController', presetController, 'PresetService');
  container.service('ProvisioningController', provisioningController, 'ProvisioningService');
  container.service('BillingPlanController', billingPlanController, 'BillingPlanService');
  container.service('RateTableController', rateTableController, 'BillingPlanService');
  container.service('ErrorMiddleware', createErrorMiddleware, 'logger', 'ENV');

  // Grouped dependencies for less parameters in top-level components
  container.factory('controllers', c => ({
    presetController: c.PresetController,
    provisioningController: c.ProvisioningController,
    billingPlanController: c.BillingPlanController,
    rateTableController: c.RateTableController,
  }));
  container.factory('middlewares', c => ({
    errorMiddleware: c.ErrorMiddleware,
  }));

  container.service('api', api, 'controllers', 'middlewares');
  return container;
}

// Re-export components for testing
export * from './controllers';
export { createErrorMiddleware } from './errorMiddleware';
export { api } from './api';

export default register;
