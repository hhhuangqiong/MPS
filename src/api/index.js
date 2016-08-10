import wrap from 'co-express';

import {
  GET_PROVISION_PRESET,
  CREATE_PROVISION_PRESET,
  UPDATE_PROVISION_PRESET,
} from './schema/preset';

import {
  createProvisioning,
  getProvisioning,
  updateProvisioning,
} from './controller/provisioning';

import {
  getProvisionPreset,
  createProvisionPreset,
  updateProvisionPreset,
} from './controller/preset';

export default server => {
  server.post('/provisioning', wrap(createProvisioning));
  server.get('/provisioning/:provisioningId', wrap(getProvisioning));
  server.put('/provisioning/:provisioningId', wrap(updateProvisioning));

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
};
