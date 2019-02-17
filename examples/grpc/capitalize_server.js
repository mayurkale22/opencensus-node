/**
 * Copyright 2019, OpenCensus Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      gRPC://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const path = require('path');
const grpc = require('grpc');
const plugin = require('@opencensus/instrumentation-grpc');
const tracing = require('@opencensus/nodejs');
const { B3Format } = require('@opencensus/propagation-b3');
const { StackdriverTraceExporter } = require('@opencensus/exporter-stackdriver');
const PROTO_PATH = path.join(__dirname, 'protos/defs.proto');
let tracer;

/**
 * Implements the Capitalize RPC method.
 */
function capitalize (call, callback) {
  const span = tracer.startChildSpan('octutorials.FetchImpl.capitalize');
  const data = call.request.data.toString('utf8');
  const capitalized = data.toUpperCase();
  for (let i = 0; i < 1000000; i++) {}
  span.end();
  callback(null, { data: Buffer.from(capitalized) });
}

/**
 * Starts an RPC server that receives requests for the Fetch service at the
 * sample server port
 */
function main () {
  const rpcProto = grpc.load(PROTO_PATH).rpc;
  const server = new grpc.Server();
  server.addService(rpcProto.Fetch.service, { capitalize: capitalize });
  server.bind('0.0.0.0:50051', grpc.ServerCredentials.createInsecure());
  server.start();
}

function setupOpencensusAndExporters () {
  const projectID = 'opencensus-java-stats-demo-app';
  // Creates Stackdriver exporter
  const exporter = new StackdriverTraceExporter({ projectId: projectID });

  // Starts Stackdriver exporter
  tracing.registerExporter(exporter).start();

  // Starts tracing and set sampling rate
  tracer = tracing.start({
    samplingRate: 1, // // For demo purposes, always sample
    propagation: new B3Format()
  }).tracer;

  // Defines basedir and version
  const basedir = path.dirname(require.resolve('grpc'));
  const version = require(path.join(basedir, 'package.json')).version;

  // Enables GRPC plugin: Method that enables the instrumentation patch.
  plugin.plugin.enable(grpc, tracer, version, {}, basedir);
}

setupOpencensusAndExporters();

main();
