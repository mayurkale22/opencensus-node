/**
 * Copyright 2018, OpenCensus Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * This is an example of exporting a custom metric from
 * OpenCensus to Stackdriver.
 */

const tracing = require('@opencensus/nodejs');
const {
  StackdriverTraceExporter
} = require("@opencensus/exporter-stackdriver");

// Add your project id to the Stackdriver options
var exporter = new StackdriverTraceExporter({projectId: "opencensus-java-stats-demo-app"});

const tracer = tracing.registerExporter(exporter).start({samplingRate: 1}).tracer

function main() {
  // 4. Create a span. A span must be closed.
  tracer.startRootSpan({name: 'main'}, rootSpan => {
    rootSpan.addAttribute('g.co/gae/app/version', '456');
    for (let i = 0; i < 10; i++) {
      doWork();
    }

    rootSpan.end();
  });
}

function doWork() {
  // 5. Start another span. In this example, the main method already started a span,
  // so that'll be the parent span, and this will be a child span.
  const span = tracer.startChildSpan('doWork');
  span.start();

  console.log('doing busy work');
  for (let i = 0; i <= 40000000; i++) {} // short delay

  // 6. Annotate our span to capture metadata about our operation

  // Attribute
  span.addAttribute('g.co/agent', 'opencensus-node');
  span.addAttribute('g.co/gae/app/version', 456);
  span.addAttribute('g.co/gce/hostname', 'gke-demo-default-pool-5a0fe154-4xhv.c.opencensus-java-stats-demo-app.internal');
  span.addAttribute('g.co/gce/instanceid', 5375730513256824000);

  span.addAnnotation('invoking doWork', {'data sent':
  '1434 bytes sent'})
  for (let i = 0; i <= 20000000; i++) {} // short delay

  //span.addStatus(400, 'This is an Error');
  span.end();
}

setTimeout(function() {
  console.log("Completed.");
}, 60 * 1000);

main();
