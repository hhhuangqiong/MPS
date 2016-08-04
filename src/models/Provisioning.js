import Joi from 'joi';
import isEmpty from 'lodash/isEmpty';
import mongoose, { Schema } from 'mongoose';

import createModel from '../utils/createModel';
import validateSchema from '../utils/validateSchema';

import {
  ArgumentNullError,
  NotFoundError,
} from 'common-errors';

const COMPLETE_STATUS = 'COMPLETE';
const IN_PROGRESS_STATUS = 'IN_PROGRESS';
const ERROR_STATUS = 'ERROR';

const DEFAULT_WLP_SERVICE_DOMAIN = 'maaii.com';
const DEFAULT_SDK_SERVICE_DOMAIN = 'm800.com';

const SERVICE_TYPE_WLP = 'WLP';

const schema = createModel({
  company_code: { type: String, unique: true, required: true },
  company_id: { type: String, unique: true, required: true },
  company_name: { type: String, required: true },
  country: String,
  service_type: { type: String, default: 'WLP' },
  payment_mode: { type: String, default: 'POST_PAID' },

  // A set of capabilities to for White Label Access control
  capabilities: [String],

  // Store the updated status after running a process including API response
  status: [{
    service: { type: String, required: true },
    state: String,
    error: Schema.Types.Mixed,
    query: Schema.Types.Mixed,
    request: Schema.Types.Mixed,
    response: Schema.Types.Mixed,
    created_at: { type: Date, default: Date.now },
  }],

  // A timestamp will be added when the bpmn has successfully completed its lifecycle
  finish_at: Date,
});

schema.statics.getCompanyByCarrierId = function getCompanyByCarrierId(carrierId) {
  const wlpDomainParts = carrierId.split(`.${DEFAULT_WLP_SERVICE_DOMAIN}`);
  const sdkDomainParts = carrierId.split(`.${DEFAULT_SDK_SERVICE_DOMAIN}`);

  let companyCode;

  if (wlpDomainParts.length > 1) {
    companyCode = wlpDomainParts[0];
  }

  if (sdkDomainParts.length > 1) {
    companyCode = sdkDomainParts[0];
  }

  if (!companyCode) {
    return Promise.reject(new NotFoundError('companyCode'));
  }

  return this.findOne({ company_code: companyCode });
};

schema
  .virtual('carrier_id')
  .get(function get() {
    const companyId = this.company_code.toLowerCase();

    const wlpServiceDomain = process.env.WLP_SERVICE_DOMAIN || DEFAULT_WLP_SERVICE_DOMAIN;
    const sdkServiceDomain = process.env.SDK_SERVICE_DOMAIN || DEFAULT_SDK_SERVICE_DOMAIN;

    return this.service_type === SERVICE_TYPE_WLP ?
    `${companyId}.${wlpServiceDomain}` :
    `${companyId}.${sdkServiceDomain}`;
  });

schema.methods.getStatus = function getStatus() {
  const isError = this.status.find(eachStatus => !isEmpty(eachStatus.error));
  const isInprogress = !this.finish_at;

  let status = COMPLETE_STATUS;

  if (isInprogress) {
    status = IN_PROGRESS_STATUS;
  }

  if (isError) {
    status = ERROR_STATUS;
  }

  return {
    data: this,
    status,
  };
};

schema.methods.updateStatus = function updateStatus(state, done) {
  const validationError = validateSchema(state, {
    service: Joi.string().required(),
    request: Joi.object().required(),
    response: Joi.object(),
    error: Joi.object(),
  });

  if (validationError) {
    throw validationError;
  }

  if (!done) {
    throw new ArgumentNullError('done');
  }

  let targetService = this.status.find(eachStatus => eachStatus.service === state.service);

  if (targetService) {
    targetService = state;
  } else {
    this.status.push(state);
  }

  this.save(err => {
    if (err) {
      throw err;
    }

    done();
  });
};

schema.methods.clearStatus = function updateStatus(done) {
  this.status = [];

  this.save(err => {
    if (err) {
      throw err;
    }

    done();
  });
};

export default mongoose.model('Provisioning', schema);
