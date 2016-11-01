# BPMN Process Guide

This is the small guide to better understand the organization of provisioning process handlers.

## Tasks

[BPMN engine](https://github.com/e2ebridge/bpmn) allows to attach handlers for every task 
in the process. To simplify the development process all business-related task handlers 
are decorated in such a way, so that the task could be represented as a function returning 
updates to the state. The function may be synchronous and asynchronous.

The following parameters are passed to the handler function:

* `state` - provisioning process state - see [Process State](#process state) section below for details
* `profile` - provisioning profile (user input coming from WLP)
* `context` - some scoped services provided by decorator, like logger or traceId

```js
async function runTask(state, profile, context) {
  // The handler function should be designed as idemponent
  if (state.results.uniqueProcessResult) {
    return state;
  }
  // Assert that task is running with expected state / profile as a good practice
  if (state.param1) {
    throw new Error('Param1 is required.');
  }
  // Extract required params from state and profile
  const params = {
    param1: state.param1,
    param2: profile.param2
  };
  // Logger will automatically append process id and handler name to the message
  logger.debug('Going to send some params to the external service', params);
  const uniqueProcessResult = await restClient.doSomeTask(params);
  
  return {
    results: {
      uniqueProcessResult,
    },
    errors: [],
  };
}

runTask.$meta = {
  name: 'EVENT_NAME_FROM_PROVISIONING_FILE',
};
```

Handler return value is interpreted in the following way
1. `results` object is merged into the `public.results` object of the process state
2. `errors` array is concatenated to the current process state at `public.errors`

## Process state

Process state is the data generated during the process. The following structure is used:

```json
{
  "public": {
    // Carrier id, enabled capabilities, etc...
    "results": {},
    // Errors, which are displayed for the end-user
    "errors": []
  },
  "system": {
    "processId": "[UUID]",
    "provisioningId": "[UUID]",
    // Detailed errors with stack traces and original error messages
    "errors": []
  }
}
```

Public process state is verified using Joi schema after each handler is invoked.
If you need to add new properties, please adjust the schema as well. 
The state schema is located at `/src/bpmn/handlers/common/state.js`

**Immutability notice**

It is also important that each time the provisioning is created or **updated**,
a different BPMN process instance is used with another process id because of 
[limitation](https://github.com/e2ebridge/bpmn/issues/36) of BPMN engine we use.
It's done to ensure the process can run on any instance of MPS in load-balanced deployments.
In case of update previous results from `public.results` are passed as an additional property 
together with the updated profile in an initial event.

## Error Handling

If the handler throws (rejects) with an error it is considered to be a **system** error.
The process would fail with `ERROR` state as soon as such error is encountered.
System error is serialized and stored under both `system.errors` and ``public.errors``. 
The errors are linked by the `traceId` which is a property of both system error and user error. 
Original error message is not exposed to a user. 

#### Partial Results

If you need to persist partial result for the later usage, but stop the process due to 
**system** error use `IncompleteResultError`

```js
const updates = {
  results: {
    partialResults: [success1, success2],
  },
}

throw new IncompleteResultError(updates, new Error('The system error happened.'));
```

#### User Errors

If the error should be entirely handled by the end user, just append a new error to the 
current state:

```js
// Error structure is not defined yet, it's just a dummy example
const userError = {
  // Think about i18n here, some code should be included to lookup the message in WLP
  name: 'IncorrectPassword',
  path: 'nested.password',
  message: 'Password is incorrect according to SOME_SERVICE. Please, change it to another one'
}

const updates = {
  errors: state.errors.concat([userError])
};

return state;
```
