import startProvisioning from './startProvisioning';
import getProvisioningStatus from './getProvisioningStatus';

export default server => {
  server.post('/provisioning', startProvisioning);
  server.get('/provisioning/:company_id', getProvisioningStatus);
};
