# Architecture

{% plantuml %}

node "White Label Portal" {
  [Company Management] as WLP_COMPANY_MGMT
}

node "Maaii Provisioning Service (MPS)" {
  interface "REST API" as MPS_REST
  MPS_REST - [Provisioning]
  MPS_REST - [Preset]
  [BPMN]
}

[WLP_COMPANY_MGMT] --> MPS_REST

database "Mongo" {
  [provisioning] as table_provisioning
  [preset] as table_preset
  [carrier provision creation] as table_bpmn_provision_creation
}

[Provisioning] -down-> [table_provisioning]
[Preset] -down-> [table_preset]
[BPMN] -down-> [table_bpmn_provision_creation]


node "Identity Access Management" {
  interface "REST API" as IAM_REST
}

[BPMN] -right-> IAM_REST

node "Carrier Provisioning Service" {
  interface "REST API" as CPS_REST
}

[BPMN] -right-> CPS_REST

node "Maaii BOSS" {
  interface "REST API" as BOSS_REST
}

[BPMN] -right-> BOSS_REST

{% endplantuml %}

The architecture diagram above demostrates the connected components from MPS perspective.

## Maaii Provisioning Service

### Provisioning

Module that provides RESTful API to manage the Maaii Platform service profiles through CPS

### Preset

Module that provides RESTful API to manage the Restrictions, i.e. options available
for a Reseller  on Reseller provisioning through WLP.

### BPMN

An open source BPMN engine that conforms to BPMN 2.0 standard. The engine runs
with a given .bpmn and triggers and the corresponding provision task to do
the provisioning. See [BPMN Guide](BPMN_GUIDE.md) and https://github.com/e2ebridge/bpmn 
for details.

## Identity Access Management

A NodeJs application that include
- REST API for managing Identities including Portal User and Companies
- REST API for managing Permissions per combination of Company and Web Service(e.g. wlp/lc)
- UI for Single Sign On

For details, see [IAM documentation](http://deploy.dev.maaii.com:9080)

## Carrier Provisioning Service

Service of Maaii Platform that provides a set of RESTful APIs for all carrier provisioning.

## Maaii BOSS

Service of BOSS that provides a provision API for billing provisioning.
