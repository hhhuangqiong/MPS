import { defineMigration } from 'm800-util';

module.exports = defineMigration(async(db) => {
  // To ensure the processId as an unqiue index to avoid duplicate records in the bpmn carrier provision creation
  await db.collection('bpmn_carrier_provision_creation').createIndex({ processId: 1 }, { unique: true });
});
