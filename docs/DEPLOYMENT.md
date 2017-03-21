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

|Key|Description| Defaults | Examples |
| --- | --- | --- | --- |
|TZ|NodeJs runtime timezone|Asia/Hong_Kong| |
|`cluster__zkConnectionString`| ZooKeeper connection string | `192.168.118.11:2181,192.168.118.12:2181,192.168.118.13:2181` | |
|`cluster__region`| Maaii cluster region | `hongkong-all` | |
|`cluster__name`| Service name in the Maaii cluster | `mps` | |
|`cluster__sequentialId`| Sequential instance index in the cluster | `null` | |
|`cluster__host`| Public domain name or IP address of the host which should be used by external services. | `localhost` | |
|`cluster__port`| Public port which should used by external services. | `3000` | |
|`cluster__protocol`| Endpoint protocol which should be used by external services. | `http` | |
|`mongodb__uri`| MongoDB URI in [Standard Connection String](https://docs.mongodb.com/manual/reference/connection-string/) format |`mongodb://testbed-usr:testbed-pw@192.168.119.71,192.168.119.73/m800-whitelabel-portal?connectTimeoutMS=300000` | mongodb://localhost:27017/maaii-provisioning-service |
|`mongodb__serviceName`| MongoDB service name in the Maaii cluster | `null` |
|`mongodb__database`| MongoDB database name. Used only with service discovery (when `mongodb__serviceName` is specified) | |
|`monogdb__connectionOptions`| Namespace to provide mongoose connection options. For available configurations, see [Mongoose API reference](http://mongoosejs.com/docs/api.html#index_Mongoose-createConnection) | | monogdb__connectionOptions__server__socketOptions__autoReconnect=true |
|`monogdb__debug`| Enable the mongo debug | false | `true` |
|`cps__baseUrl`| CPS API Endpoint |`http://192.168.118.34:80` |  |
|`cps__timeout`| CPS API Endpoint Timeout | 60000 | |
|`cps__serviceName`| CPS service name, used to find CPS endpoint in ZooKeeper | `cps` | |
|`boss__baseUrl`| BOSS API Endpoint |`http://192.168.135.167:10080` | |
|`boss__timeout`| BOSS API Timeout | 15000 | |
|`boss__serviceName`| BOSS service name, used to find BOSS endpoint in ZooKeeper | `null` | |
|`iam__baseUrl` | IAM API Endpoint | `http://deploy.dev.maaii.com:4004` | |
|`iam__timeout` | IAM API Endpoint Timeout | 15000 | |
|`iam__serviceName`| IAM service name, used to find IAM endpoint in ZooKeeper | `iam` | |
|`signUpRule__baseUrl` | Sign up rule service API Endpoint | `http://192.168.118.127:8083` | |
|`signUpRule__timeout` | Sign up rule service API Endpoint Timeout | 15000 | |
|`signUpRule__serviceName`| Sign Up Rules service name, used to find Sign Up Rules endpoint in ZooKeeper | `signup-rule` | |
|`maaiiRate__baseUrl` | MAAII RATE API Endpoint | `http://192.168.118.127:9126` | |
|`maaiiRate__timeout` | MAAII RATE API Timeout | 15000 | |
|`maaiiRate__serviceName`| RATE service name, used to find RATE endpoint in ZooKeeper | `rates-deployment` | |
|`bpmn__maxConcurrentRequests` | Max concurrent requests that would sent to backend APIs during single BPMN stage | `4` | |
|`bpmn__templates__collectionName` | MongoDB collection name for provisioning templates configuration | `config`| |
|`bpmn__templates__documentId` | MongoDB document _id where templates are stored | `templates` | |

**Notes**
1. Keys defined with __ in between words are due to default setup of [nconf](https://github.com/indexzero/nconf), an npm module that we used to organize application configurations.
2. Service discovery is the preferred way to lookup external services. Hardcoded service urls and database
connection strings in environment variables, such as `mongodb__uri`, `cps__baseUrl`, etc., will eventually
be obsoleted.

## Provisioning Process Configuration

Application reads provisioning configuration template from MongoDB.
See the [previous section](#application-configurations---docker-container-environment-variables)
to see how to configure collection name and document id.

If the configuration is not provided in the database, application will read the default
configuration which is shipped with the source code.

You can update the template configuration using simple mongo shell script
```js
var json = cat('/path/to/templates.json');
var doc = JSON.parse(json);
db.config.update({_id: 'templates'}, doc, {upsert: true});
```

You can use the following default `templates.json` as a reference

[include](../src/services/templates.json)
