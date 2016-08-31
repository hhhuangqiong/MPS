# Introduction

Maaii Provisioning Service(MPS) is a service that enables automation of service provisioning offered by
Maaii/M800. The main objective of the MPS is to replace the traditional manual service provisioning
through done through CSR forms.

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

# Roadmap

- [ ] Scaling - enable MPS to horizontal scale
- [ ] API Documentation - generate API documentation using selected tool
- [ ] Toggle services on/off on update(PUT) - Sparkle Phase 2
- [ ] Metrics integration - monitoring
