import _ from 'lodash';
import { ArgumentNullError } from 'common-errors';

import CpsRequest from './CpsRequest';

export default class CertificateManagement extends CpsRequest {
  constructor(baseUrl = '') {
    super(baseUrl);
  }

  getTemplates(group = '') {
    const uri = '/1.0/certificates/templates';

    if (_.isEmpty(group)) {
      return this.validationErrorHandler(new ArgumentNullError('group'));
    }

    return this.get(`${uri}?group=${group}`);
  }

  create(template) {
    const uri = '/1.0/certificates';

    // no validation or strict checking on template schema. Relying on CPS
    // validation
    return this.post(uri, template);
  }
}
