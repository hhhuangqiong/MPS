import ioc from '../../../ioc';
const { userCarrierProfileCreationRequest } = ioc.container.carrierManagement;

export default function userCarrierProfileCreation(data, done) {
  const { model } = data;

  const callback = () => done(data);

  const status = {
    service: 'userCarrierProfileCreation',
    request: {
      carrierId: model.carrier_id,
      attributes: {
        'com|maaii|service|voip|ice|disabled': 'true',
        'com|maaii|service|voip|enabled': 'true',
        'com|maaii|user|type|preapaid': 'true',
        'com|maaii|application|credit|upperlimit': '-1',
        'com|maaii|application|earning|Email|amount': '0.3',
        'com|maaii|application|earning|FBpost|amount': '0.3',
        'com|maaii|application|earning|Twitterpost|amount': '0.3',
        'com|maaii|application|earning|WBpost|amount': '0.3',
        'com|maaii|application|earning|enabled': 'false',
        'com|maaii|application|earning|random|enabled': 'true',
        'com|maaii|application|earning|rateus|amount': '0.3',
        'com|maaii|application|earning|smsinvite|amount': '1',
        'com|maaii|service|voip|packetlossthreshold': '7',
      },
    },
  };

  userCarrierProfileCreationRequest(status.request)
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
