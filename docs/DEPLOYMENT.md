# Deployment

## Artifact - Docker

This application is released as a docker image bundle, to be run as a docker container. This section provide the necessary information to for application deployment.

The image can be pulled from the [Docker Repository](http://docker.dev.maaii.com/repositories)

### Docker image Identifier

``` Identifier
docker.dev.maaii.com/m800/maaii-provisioning-service
```

### Docker image specification

Checkout the latest docker image specifications (e.g. exposed ports, mount volumes) from the [git repo](http://gerrit.dev.maaii.com/gitweb?p=maaii-provisioning-service.git;a=tree)


## Application Configurations - Docker Container Environment Variables

The application can be configured using docker container environment variables. A list of configuration available configuration keys are specified below:

|Key|Description| Defaults | e.g. |
| --- | --- | --- | --- |
|TZ|NodeJs runtime timezone|Asia/Hong_Kong| |
|`mongodb__uri`| MongoDB URI in [Standard Connection String](https://docs.mongodb.com/manual/reference/connection-string/) format |`mongodb://testbed-usr:testbed-pw@192.168.119.71,192.168.119.73/m800-whitelabel-portal?connectTimeoutMS=300000` | |
|`cps__api__baseUrl`| CPS API Endpoint |`http://192.168.118.34:80` |  |
|`cps__api__timeout`| CPS API Endpoint Timeout | 15000 | |
|`cps__wlServiceDomain` | Top-level domain that will be used to generated carrier Id for white label customers | maaii.com | e.g. maaiii.org |
|`cps__sdkServiceDomain` | Top-level domain that will be used to generated carrier Id for sdk customers | m800-api.com | e.g. m800-api.org |
|`cps__chargeProfile__company` | Company level charging profile to be used for SMS/Voice provisioning | m800_charge_profile | |
|`cps__chargeProfile__user` | User level charging profile to be used for SMS/Voice provisioning | maaii_charge_profile | |
|`boss__api__baseUrl`| BOSS API Endpoint |`http://192.168.135.167:10080` | |
|`boss__api__timeout`| BOSS API Timeout | 15000 | |
|`boss__prePaidInitialBalance`| Initial wallet balance in Maaii Boss for prepaid users | 0 | |
|`boss__postPaidInitialBalance`| Initial wallet balance in Maaii Boss for postpaid users | 99999999 | |

Note: Keys defined with __ in between words are due to default setup of [nconf](https://github.com/indexzero/nconf), an npm module that we used to organize application configurations.
