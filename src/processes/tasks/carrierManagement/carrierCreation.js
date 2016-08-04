import container from '../../../ioc';
const { carrierCreationRequest } = container.carrierManagement;

export default function carrierCreation(data, done) {
  const { model } = data;

  const callback = () => done(data);

  const status = {
    service: 'carrierCreation',
    request: {
      identifier: model.carrier_id,
      alias: model.company_code,
    },
  };

  carrierCreationRequest(status.request)
    .then(response => {
      const payload = {
        response: response && response.body,
      };

      model.updateStatus(Object.assign(status, payload), callback);
    })
    .catch(error => {
      const payload = {
        error,
      };

      model.updateStatus(Object.assign(status, payload), callback);
    });
}
