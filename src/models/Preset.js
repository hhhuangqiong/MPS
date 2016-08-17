import mongoose from 'mongoose';
import unqiueValidator from 'mongoose-unique-validator';

import createModel from '../utils/createModel';
import { ServiceTypes, PaymentModes } from './Provisioning';


const schema = createModel({
  presetId: { type: String, unique: true, required: true, index: true },
  serviceType: { type: String, enum: ServiceTypes },
  paymentMode: { type: String, enum: PaymentModes },
  capabilities: { type: Array },
}, { id: false, versionKey: false });

schema.plugin(unqiueValidator);

export default mongoose.model('Preset', schema);
