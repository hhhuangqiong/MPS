# Maaii Provisioning Service(MPS)

Maaii Provisioning Service(MPS) is a service that enables automation of service provisioning offered by
Maaii/M800. The main objective of the MPS is to replace the traditional manual service provisioning
through done through CSR forms.

See API docs [here](http://deploy.dev.maaii.com:9080/maaii-provisioning-service-api/latest).

## Development

Run development server using following command:
```bash
npm run dev
```
You can also use simple watch mode without running the server.
```bash
npm run watch
node ./build/src/server
```

## Roadmap

- [ ] Scaling - enable MPS to horizontal scale
- [ ] API Documentation - generate API documentation using selected tool
- [ ] Toggle services on/off on update(PUT) - Sparkle Phase 2
- [ ] Metrics integration - monitoring
