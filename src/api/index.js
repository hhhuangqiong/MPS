import {
  GET_PROVISION_PRESET,
  CREATE_PROVISION_PRESET,
  UPDATE_PROVISION_PRESET,
} from './schema/preset';

import {
  START_PROVISIONING_SCHEMA,
  GET_PROVISIONING_STATUS_SCHEMA,
  GET_PROVISIONING_ALL_STATUS_SCHEMA,
  RETRY_PROVISIONING_SCHEMA,
} from './schema/provisioning';

import {
  SERVICE_PROFILE_SCHEMA,
} from './schema/serviceProfile';

import {
  startProvisioning,
  getProvisioningStatus,
  getProvisioningStatusByCompanies,
  retryProvisioning,
} from './controller/provisioning';

import {
  getProvisionPreset,
  createProvisionPreset,
  updateProvisionPreset,
} from './controller/preset';

import {
  getServiceProfile,
} from './controller/serviceProfile';

export default server => {
  /**
   * Provisioning Request
   */

  // 1. Start Provisioning
  server.post('/provisioning', START_PROVISIONING_SCHEMA, startProvisioning);

  // 2. Get Provisioning Status by Query
  server.get('/provisioning', GET_PROVISIONING_STATUS_SCHEMA, getProvisioningStatus);

  // 3. Get Provisioning Status by a list of company_id
  server.get(
    '/provisioning/companies',
    GET_PROVISIONING_ALL_STATUS_SCHEMA,
    getProvisioningStatusByCompanies
  );

  // 4. Retry failed provisioning
  server.post(
    '/provisioning/retry/:provision_id',
    RETRY_PROVISIONING_SCHEMA,
    retryProvisioning
  );

  /**
   * Preset Provisioning Request
   */

  // 1. Get Provision Preset
  server.get(
    '/preset/:preset_id',
    GET_PROVISION_PRESET,
    getProvisionPreset
  );

  // 2. Create Provision Preset
  server.post(
    '/preset/:preset_id',
    CREATE_PROVISION_PRESET,
    createProvisionPreset
  );

  // 3. Update Provision Preset
  server.put(
    '/preset/:preset_id',
    UPDATE_PROVISION_PRESET,
    updateProvisionPreset
  );

  /**
   * Service Profile Request
   */

  // Get Service Profile
  server.get(
    '/profile/:company_id',
    SERVICE_PROFILE_SCHEMA,
    getServiceProfile
  );
};
