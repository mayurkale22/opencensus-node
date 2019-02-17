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

function main () {
  const rpcProto = grpc.load(PROTO_PATH).rpc;
  const client = new rpcProto.Fetch('localhost:50051',
    grpc.credentials.createInsecure());
  let data;
  if (process.argv.length >= 3) {
    data = process.argv[2];
  } else {
    data = 'opencensus';
  }
  console.log('> ', data);

  tracer.startRootSpan({ name: 'octutorialsClient.capitalize' }, rootSpan => {
    client.Capitalize({ data: Buffer.from(data) }, function (err, response) {
      if (err) {
        console.log('could not get grpc response');
        return;
      }
      console.log('< ', response.data.toString('utf8'));
      rootSpan.end();
    });
  });

  setTimeout(() => {
    console.log('done.');
  }, 60000);
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
