# OpenCensus Tutorial - Node.js

## Required Reading
To fully understand this platform API, it's helpful to be familiar with the [OpenCensus](https://opencensus.io) project and terminology more specifically.

## Requirements

[]Node.js](https://nodejs.org/) 6 or above and npm (already comes with Node.js). For assistance setting up Node.js, [Click here](https://nodejs.org/) for instructions.

Then, let’s install the OpenCensus package with:
```
npm install @opencensus/nodejs
```

## Lessons

* [Lesson 01 - Quickstart](./lesson01)
  * Instantiate a Tracer
  * Create a simple trace
* [Lesson 02 - Multi Tracing with Annotations and Attributes](./lesson02)
  * Trace individual functions
  * Combine multiple spans into a single trace
  * Add Annotations and Attributes
* [Lesson 03 - Using Exporters](./lesson03)
  * Configure exporter to export traces
    * Export to Zipkin
    * Export to Stackdriver
    * Export to Jaeger
* [Lesson 04 - HTTP Instrumentation](./lesson04)
  * Automatic tracing support on HTTP
* [Lesson 05 - gRPC Instrumentation](./lesson05)
  * Automatic tracing support on gRPC
* [Lesson 06 - Redis Instrumentation](./lesson06)
  * Automatic tracing support on Redis
* [Lesson 07 - MongoDB Instrumentation](./lesson07)
  * Automatic tracing support on MongoDB
