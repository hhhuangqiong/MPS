import {
  presetController,
  provisioningController,
} from './controllers';
import createErrorMiddleware from './errorMiddleware';
import api from './api';

export function register(container) {
  container.service('PresetController', presetController, 'PresetService');
  container.service('ProvisioningController', provisioningController, 'ProvisioningService');
  container.service('ErrorMiddleware', createErrorMiddleware, 'logger');

  // Grouped dependencies for less parameters in top-level components
  container.factory('controllers', c => ({
    presetController: c.PresetController,
    provisioningController: c.ProvisioningController,
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
