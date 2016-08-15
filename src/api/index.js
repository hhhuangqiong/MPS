// import {
//   GET_PROVISION_PRESET,
//   CREATE_PROVISION_PRESET,
//   UPDATE_PROVISION_PRESET,
// } from './schema/preset';

// import {
//   getProvisionPreset,
//   createProvisionPreset,
//   updateProvisionPreset,
// } from './controller/preset';

import {
  createProvisioning,
  getProvisioning,
  updateProvisioning,
} from './controller/provisioning';

export default server => {
  server.post('/provisioning', createProvisioning);
  server.get('/provisioning', getProvisioning);
  server.get('/provisioning/:provisioningId', getProvisioning);
  server.put('/provisioning/:provisioningId', updateProvisioning);

  /**
   * Preset Provisioning Request
   */

  // 1. Get Provision Preset
  // server.get(
  //   '/preset/:preset_id',
  //   GET_PROVISION_PRESET,
  //   getProvisionPreset
  // );
  //
  // // 2. Create Provision Preset
  // server.post(
  //   '/preset/:preset_id',
  //   CREATE_PROVISION_PRESET,
  //   createProvisionPreset
  // );
  //
  // // 3. Update Provision Preset
  // server.put(
  //   '/preset/:preset_id',
  //   UPDATE_PROVISION_PRESET,
  //   updateProvisionPreset
  // );
};
