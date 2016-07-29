import expressJoiValidator from 'express-joi-validator';

import {
  startProvisioningSchema,
  getProvisioningAllStatusSchema,
  getProvisioningStatusSchema,
  retryProvisioningSchema,
  getServiceProfileSchema,
} from './schema';

import startProvisioning from './startProvisioning';
import getProvisioningStatus from './getProvisioningStatus';
import getProvisioningAllStatus from './getProvisioningAllStatus';
import retryProvisioning from './retryProvisioning';
import getServiceProfile from './getServiceProfile';

export default server => {
  // 1. Start Provisioning
  server.post(
    '/provisioning',
    expressJoiValidator(startProvisioningSchema),
    startProvisioning
  );

  // 2. Get Provisioning Status by Query
  server.get(
    '/provisioning',
    expressJoiValidator(getProvisioningStatusSchema),
    getProvisioningStatus
  );

  // 3. Get Provisioning Status by a list of company_id
  server.get(
    '/provisioning/companies',
    expressJoiValidator(getProvisioningAllStatusSchema),
    getProvisioningAllStatus
  );

  // 4. Retry failed provisioning
  server.post(
    '/provisioning/retry/:provision_id',
    expressJoiValidator(retryProvisioningSchema),
    retryProvisioning
  );

  // 5. Get Service Profile
  server.get(
    '/profile/:company_id',
    expressJoiValidator(getServiceProfileSchema),
    getServiceProfile
  );
};
