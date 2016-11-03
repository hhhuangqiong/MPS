# Project Structure

{% plantuml %}
@startuml

package "Public Interface" {
  [API]
}
package "Core" {
  [BPMN]
  [Services]
  [Domain]
  cloud "Event Bus" as Bus
}

API -down-> Services
BPMN -right-> Services
Bus -left-> BPMN
Services -down-> Domain
Services -left-> Bus
BPMN -down-> Domain

@enduml
{% endplantuml %}

Please, also consider the following guidelines when adding new functionality

- api

Express routes, exposes public MPS api
May include controllers (concrete endpoints) and middlewares (cross-cutting concerns like 
authentication, error-handling, metrics, etc.)

- bpmn

Coordinates provisioning process event handlers. 
Open bpmn/provisioning.bpmn in [Camunda Modeler](https://camunda.org/download/modeler/) to see 
the flow of events. See [BPMN Guide](BPMN_GUIDE.md) for additional details about module 
organization.

- config

Imports application configuration. Please avoid directly importing config, use dependency
injection instead

- domain

Domain-specific logic. Can be directly referenced from other modules. Should not depend on 
anything except util. Start putting code here if you feel that it could benefit from separate 
unit testing or you find duplicated project-specific code in multiple places.

- infrastructure 

Everything external that is required for application to work: loggers, database connections, 
queue connections, etc.

- services

Application services: internal and external. You should generally avoid making them HTTP-aware,
e.g. they should accept and return plain objects. When developing a wrapper for external HTTP service,
please avoid exposing request objects directly: parse responses and errors appropriately

- util

Utility functions. Can be directly referenced from other modules. Please, DO NOT put 
project-specific code here. Please DO NOT put functions, that are not shared 
between multiple other modules. The semantics of util is project-independent code, 
candidate for making a new internal library.
