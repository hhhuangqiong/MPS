import ioc from '../../../ioc';
const { carrierProfileCreationRequest } = ioc.container.carrierManagement;

export default function carrierProfileCreation(data, done) {
  const { model } = data;

  const callback = () => done(data);

  const status = {
    service: 'carrierProfileCreation',
    request: {
      carrierId: model.carrier_id,
      attributes: {
        'com|maaii|management|validation|sms|code|length': '3',
        'com|maaii|im|group|participant|max': '20',
        'com|maaii|service|voip|route': 'mss',
      },
    },
  };

  carrierProfileCreationRequest(status.request)
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
