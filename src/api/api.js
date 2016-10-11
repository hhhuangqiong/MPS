import { Router } from 'express';

import { check } from './../util';

export function api(controllers, middlewares) {
  check.members('controllers', [
    'presetController',
    'provisioningController',
  ]);
  check.members('middlewares', [
    'errorMiddleware',
  ]);

  const router = new Router();
  const {
    presetController,
    provisioningController,
  } = controllers;
  const {
    errorMiddleware,
  } = middlewares;

  router.post('/provisioning', provisioningController.createProvisioning);
  router.get('/provisioning', provisioningController.getProvisioning);
  router.get('/provisioning/:provisioningId', provisioningController.getProvisioning);
  router.put('/provisioning/:provisioningId', provisioningController.updateProvisioning);

  router.post('/preset/:presetId', presetController.setPreset);
  router.get('/preset/:presetId', presetController.getPreset);

  router.use(errorMiddleware);

  return router;
}

export default api;
