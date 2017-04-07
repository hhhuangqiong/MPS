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
    'rateTableController',
    'billingPlanController',
  ]);
  check.members('middlewares', middlewares, [
    'errorMiddleware',
  ]);

  const router = new Router();
  const {
    presetController,
    provisioningController,
    rateTableController,
    billingPlanController,
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

  router.post('/billing-plans', billingPlanController.createBillingPlan);
  router.get('/billing-plans', billingPlanController.getBillingPlans);
  router.put('/billing-plans/:billingPlanId', billingPlanController.updateBillingPlan);
  router.get('/billing-plans/:billingPlanId', billingPlanController.getBillingPlan);
  router.get('/billing-plans/:billingPlanId/rate-tables/:type', billingPlanController.downloadRateTableFromPlan);

  router.post('/rate-tables', upload.single('file'), rateTableController.uploadRateTable);
  router.get('/rate-tables/:rateTableId', rateTableController.downloadRateTable);
  router.delete('/rate-tables/:rateTableId', rateTableController.removeRateTable);

  router.use((req, res, next) => {
    next(new NotFoundError(req.path));
  });
  router.use(errorMiddleware);

  return router;
}

export default api;
