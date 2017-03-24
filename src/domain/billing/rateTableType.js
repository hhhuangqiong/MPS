import _ from 'lodash';

export const RateTableType = {
  SMS: 'SMS',
  OFFNET_CALL: 'OFFNET_CALL',
  CURRENCY_EXCHANGE: 'CURRENCY_EXCHANGE',
};

export const RateTableTypes = _.values(RateTableType);

export default RateTableType;
