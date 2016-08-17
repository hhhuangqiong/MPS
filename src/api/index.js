import {
  setPreset,
  getPreset,
} from './controller/preset';

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

  server.post('/preset/:presetId', setPreset);
  server.get('/preset/:presetId', getPreset);
};
