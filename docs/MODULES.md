# Modules

This document describes the implementation details of  modules mentioned in 
[Project Structure](PROJECT_STRUCTURE.md).

## Services 

They are located under `src/services`. 
There are 3 types of services that are used in the MPS.

#### 1. External API services

HTTP client libraries which wrap external back-end APIs like 
[BOSS](https://issuetracking.maaii.com:9443/display/MAAIIP/Maaii+Boss), 
[CPS](https://issuetracking.maaii.com:9443/display/MAAIIP/Maaii+CPS), 
[MUMS](https://issuetracking.maaii.com:9443/display/MAAIIP/MUMS), 
[IAM](http://deploy.dev.maaii.com:9080/maaii-identity-access-mgmt/api/latest/).

#### 2. Exposed MPS services

- **PresetService**

Manage provisioning presets. Provision preset is a predefined provisioning profile
which can be reused in MPS for common parameters.

- **ProvisioningService**

Provision service manages provision processes, exposes their statuses, results and errors.

#### 3. Internal services

- **Template service**

Used to render json templates, e.g. an object with interpolated property values.
Uses hierarchical key/value *storage services* underneath:
 
- Memory storage which uses a simple hash object to store key/value pairs.
- MongoDB storage which uses MongoDB document to store key/value pairs.
- Composite storage which composes multiple storages in such a way, that if the value
  was not found, it delegates to the next storage in the chain.

## TODO

- [] Provide better api documentation links which lead to exact api method descriptions
and not general description pages
