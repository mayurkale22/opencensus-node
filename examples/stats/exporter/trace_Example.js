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
const zipkin = require('@opencensus/exporter-zipkin');

const options = {
  url: 'http://localhost:9411/api/v2/spans',
  serviceName: 'demo'
}
const exporter = new zipkin.ZipkinTraceExporter(options);

const tracer = tracing.registerExporter(exporter).start({samplingRate: 1}).tracer

function main() {
  // 4. Create a span. A span must be closed.
  tracer.startRootSpan({name: 'main'}, rootSpan => {
    rootSpan.addAttribute('first', '456');
    rootSpan.addAttribute('second', '456')
    rootSpan.addAttribute('third', '456')
    rootSpan.addAttribute('fourth', '456')
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
  span.addAttribute('g.co/first', 'opencensus-node');
  span.addAttribute('g.co/second', 456);
  span.addAttribute('g.co/gce/third', 'gke-demo-default-pool-5a0fe154-4xhv.c.opencensus-java-stats-demo-app.internal');
  span.addAttribute('g.co/gce/forth', 5375730513256824000);

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
