import { Schema } from 'mongoose';
import createModel from '../utils/createModel';

export default createModel(
  'Provisioning',
  {
    company_id: { type: String, required: true },
    carrier_id: { type: String, unique: true, required: true },
    parant_company: { type: String, required: true },
    country: String,
    service_type: { type: String, default: 'WLP' },
    payment_mode: { type: String, default: 'POST_PAID' },

    // A set of capabilities to for White Label Access control
    capabilities: [String],

    // Store the updated status after running a process including API response
    status: [{
      service: { type: String, unique: true, required: true },
      state: String,
      error: Schema.Types.Mixed,
      query: Schema.Types.Mixed,
      request: Schema.Types.Mixed,
      response: Schema.Types.Mixed,
      created_at: { type: Date, default: Date.now },
    }],
  }
);
