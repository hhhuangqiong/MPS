import { describe, it } from 'mocha';
import { internet } from 'faker';
import { expect } from 'chai';

import {
  expectNotExist,
  missingRequiredField,
} from '../expectValidator';

import VoiceProvisioningManagement from '../../src/requests/VoiceProvisioningManagement';
const voiceProvisioningManagement = new VoiceProvisioningManagement('http://192.168.118.23:9000');

function addEscapeToString(str = '') {
  return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
}

describe('Voice Provisioning Management', () => {
  const identifier = internet.domainName();

  it('should not pass validation for missing arg "identifier"', () => (
    voiceProvisioningManagement
      .sipRoutingProfileCreation()
      .then(expectNotExist)
      .catch(missingRequiredField('identifier'))
  ));

  it('should not pass validation for missing arg "trunks"', () => (
    voiceProvisioningManagement
      .sipRoutingProfileCreation({
        identifier,
      })
      .then(expectNotExist)
      .catch(missingRequiredField('trunks'))
  ));

  xit('should receive an id after SIP Gateway creation', () => {
    const number = 1;

    voiceProvisioningManagement
      .sipGatewayCreation({
        identifier: `${identifier}.gateway.tsbc${number}`,
        description: `Transcoding SBC #${number}`,
        host: '192.168.35.50',
        port: 5080,
        manipulation_rules: [
          {
            description: 'NGN Header To Prefix Manipulation',
            matcher: {
              type: 'RegExField',
              description: 'For all numbers',
              field_name: 'To',
              regular_expression: '^((:?tel:)?\\+?)([1-9]\\d+)$',
            },
            manipulator: {
              type: 'OffNetCall',
              description: 'Replace From Header With Anonymous',
              from_address: 'anonymous',

              // temporary set a fake prefix for overriding server validation
              gateway_prefix: '+00240063',

              enabled: false,
              is_passerted_id_enabled: false,
              is_one_card_multiple_no: false,
            },
          },
        ],
      })
      .then(response => {
        expect(response.body).to.exist;
        expect(response.body.id).to.be.instanceof(String);
      })
      .catch(expectNotExist);
  });

  xit('should receive an id after SIP Routing creation', () => (
    voiceProvisioningManagement
      .sipRoutingProfileCreation({
        identifier: `${identifier}.profile`,
        description: `For ${identifier} carrier`,
        trunks: [{
          matchers: [{
            type: 'RegExField',
            description: `Select caller Only Within Domain ${identifier}`,
            field_name: 'From',
            regular_expression: `^((:?sip:)?\\+{0,1})(.*[A-Za-z_]+.*)@${addEscapeToString(identifier)}$`,
          }],
          gateway_selection_rules: [
            {
              description: `Select caller Only Within Domain ${identifier}`,
              matcher: {
                type: 'RegExField',
                description: `Select caller Only Within Domain ${identifier}`,
                field_name: 'From',
                regular_expression: `^((:?sip:)?\\+{0,1})(.*[A-Za-z_]+.*)@${addEscapeToString(identifier)}$`,
              },
              gateway: `${identifier}.gateway.tsbc01`,
            },
            {
              description: `Select caller Only Within Domain ${identifier}`,
              matcher: {
                type: 'RegExField',
                description: `Select caller Only Within Domain ${identifier}`,
                field_name: 'From',
                regular_expression: `^((:?sip:)?\\+{0,1})(.*[A-Za-z_]+.*)@${addEscapeToString(identifier)}$`,
              },
              gateway: `${identifier}.gateway.tsbc02`,
            },
          ],
        }],
      })
      .then(response => {
        expect(response.body).to.exist;
        expect(response.body.id).to.be.instanceof(String);
      })
      .catch(expectNotExist)
  ));
});
