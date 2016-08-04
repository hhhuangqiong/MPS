// In order to support async/await
import 'babel-polyfill';

import mongoose from 'mongoose';
import heathCheck from 'm800-health-check';

import connectMongoose from '../initializer/connectMongoose';
import logger from '../initializer/logger';
import listener from './listener';

import server from './server';

heathCheck(server, {
  mongodb: {
    mongoose,
  },
});

connectMongoose(process.env.MONGODB_URI)
  .tap(logger)
  .then(() => {
    listener(server).tap(logger);
  });
