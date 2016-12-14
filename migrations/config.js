import config from '../src/config';

module.exports = {
  changelogCollectionName: 'changelog',
  mongodb: {
    url: config.mongodb.uri,
  },
};
