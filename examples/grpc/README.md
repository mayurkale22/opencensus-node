# Overview

Our service takes in a payload containing bytes and capitalizes them.

Using OpenCensus Node, we can collect traces of our system and export them to the backend of our choice, to give observability to our distributed systems.


## Installation

```sh
$ # from this directory
$ npm install
```


## Run the Application

There are two ways to generate the code needed to work with protocol buffers in Node.js - one approach uses [Protobuf.js](https://github.com/dcodeIO/ProtoBuf.js/) to dynamically generate the code at runtime, the other uses code statically generated using the protocol buffer compiler `protoc`. The examples behave identically, and either server can be used with either client.

 - Run the server

   ```sh
   $ # from this directory
   $ node ./capitalize_server.js &
   ```

 - Run the client

   ```sh
   $ # from this directory
   $ node ./capitalize_client.js
   ```

## Useful links
- For more information on OpenCensus, visit: <https://opencensus.io/>
- To checkout the OpenCensus for Node.js, visit: <https://github.com/census-instrumentation/opencensus-node>

## LICENSE

Apache License 2.0
