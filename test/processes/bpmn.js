import { describe, it } from 'mocha';
import { expect } from 'chai';
import uuid from 'uuid';

import expectNotExist from '../lib/expectNotExist';

import container from '../../src/ioc';
const { provisioningManager } = container;

const START_EVENT_NAME = 'PROVISIONING_START';
const END_EVENT_NAME = 'PROVISIONING_END';

describe('bpmn', () => {
  describe('Validation', () => {
    it('should show error when there is no process id', () => (
      provisioningManager
        .createProcess()
        .then(expectNotExist)
        .catch(error => {
          expect(error).to.exist;
          expect(error.name).to.equal('ArgumentNullError');
          expect(error.argumentName).to.equal('processId');
        })
    ));
  });

  describe('Process', () => {
    const mockProcessId = uuid.v1();

    it('should create process successfully', () => (
      provisioningManager
        .createProcess(mockProcessId)
        .then(result => {
          expect(result).to.exist;
          expect(result._implementation).to.exist;
          expect(result._implementation.processId).to.equal(mockProcessId);
        })
        .catch(expectNotExist)
    ));

    it('should find a process by processId', () => (
      provisioningManager
        .getProcess(mockProcessId)
        .then(result => {
          expect(result).to.exist;
          expect(result.processId).to.equal(mockProcessId);
        })
        .catch(expectNotExist)
    ));

    it('should not find a non exist process', () => {
      const randomId = uuid.v1();

      return provisioningManager
        .getProcess(randomId)
        .then(expectNotExist)
        .catch(error => {
          expect(error).to.exist;
          expect(error.message).to.equal(`Fail to get process by id ${randomId}`);
        });
    });

    it('should not trigger event for missing event name', () => (
      provisioningManager
        .triggerEvent(mockProcessId)
        .then(expectNotExist)
        .catch(error => {
          expect(error).to.exist;
          expect(error.name).to.equal('TypeError');
          expect(error.message).to.equal('eventName is not a string or it is empty');
        })
    ));

    it('should not trigger event for a wrong starting event name', () => (
      provisioningManager
        .triggerEvent(mockProcessId, 'WRONG_NAME')
        .then(expectNotExist)
        .catch(error => {
          expect(error).to.exist;
          expect(error.message).to.equal("The process 'mps' does not know the event 'WRONG_NAME'");
        })
    ));


    xit('should trigger starting event correctly', () => (
      provisioningManager
        .triggerEvent(mockProcessId, START_EVENT_NAME)
        .then(result => {
          expect(result).to.exist;
          expect(result.views).to.exist;

          expect(result.views.startEvent).to.exist;
          expect(result.views.startEvent.name).to.equal(START_EVENT_NAME);

          expect(result.views.endEvent).to.exist;
          expect(result.views.endEvent.name).to.equal(END_EVENT_NAME);

          expect(result.history).to.exist;
          expect(result.history.historyEntries).to.exist;
          expect(result.history.historyEntries.length).to.be.above(0);
        })
        .catch(expectNotExist)
    ));

    xit('should not trigger the same event again', () => (
      provisioningManager
        .triggerEvent(mockProcessId, START_EVENT_NAME)
        .then(expectNotExist)
        .catch(error => {
          expect(error).to.exist;
          expect(error.message)
            .to
            .equal("The start event 'PROVISIONING_START' cannot start an already started process.");
        })
    ));

    it('should trigger start event with data', () => (
      provisioningManager
        .start()
        .then(result => {
          expect(result).to.exist;
          expect(result.views).to.exist;
        })
        .catch(expectNotExist)
    ));
  });
});
