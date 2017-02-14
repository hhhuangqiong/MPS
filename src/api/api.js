import { Router } from 'express';
import { NotFoundError } from 'common-errors';
import { check } from 'm800-util';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage });

export function api(controllers, middlewares) {
  check.members('controllers', controllers, [
    'presetController',
    'provisioningController',
  ]);
  check.members('middlewares', middlewares, [
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

  router.post('/provisioning',
    upload.single('logo'),
    provisioningController.createProvisioning,
  );
  router.get('/provisioning', provisioningController.getProvisioning);
  router.get('/provisioning/:provisioningId', provisioningController.getProvisioning);
  router.put('/provisioning/:provisioningId', provisioningController.updateProvisioning);

  router.post('/preset/:presetId', presetController.setPreset);
  router.get('/preset/:presetId', presetController.getPreset);

  router.use((req, res, next) => {
    next(new NotFoundError(req.path));
  });
  router.use(errorMiddleware);

  return router;
}

export default api;
