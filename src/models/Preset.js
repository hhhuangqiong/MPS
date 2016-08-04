import mongoose from 'mongoose';

import createModel from '../utils/createModel';

const schema = createModel({
  preset_id: { type: String, unique: true, required: true },

  service_type: { type: String, default: 'WLP' },
  payment_mode: { type: String, default: 'POST_PAID' },
  capabilities: [String],
});

export default mongoose.model('Preset', schema);
