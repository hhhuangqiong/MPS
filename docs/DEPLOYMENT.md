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
|`monogdb__server`| Options for MongoDB connection. Namespace to provide extra mongoDB server options for connection. For available configurations, see [Node.js MongoDB Driver API](http://mongodb.github.io/node-mongodb-native/2.2/api/Server.html) | | monogdb__server__socketOptions__autoReconnect=true |
|`cps__baseUrl`| CPS API Endpoint |`http://192.168.118.34:80` |  |
|`cps__timeout`| CPS API Endpoint Timeout | 60000 | |
|`boss__baseUrl`| BOSS API Endpoint |`http://192.168.135.167:10080` | |
|`boss__timeout`| BOSS API Timeout | 15000 | |
|`iam__baseUrl` | IAM API Endpoint | `http://deploy.dev.maaii.com:4004` | |
|`iam__timeout` | IAM API Endpoint Timeout | `15000` | |
|`signUpRule__baseUrl` | Sign up rule service API Endpoint | `http://192.168.118.127:8083` | |
|`signUpRule__timeout` | Sign up rule service API Endpoint Timeout | `15000` | |
|`bpmn__maxConcurrentRequests` | Max concurrent requests that would sent to backend APIs during single BPMN stage | `4`
|`bpmn__templates__collectionName` | MongoDB collection name for provisioning templates configuration | `config`
|`bpmn__templates__documentId` | MongoDB document _id where templates are stored | `templates`

Note: Keys defined with __ in between words are due to default setup of [nconf](https://github.com/indexzero/nconf), an npm module that we used to organize application configurations.

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
