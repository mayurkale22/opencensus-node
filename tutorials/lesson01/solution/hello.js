const tracing = require('@opencensus/nodejs');

// Get the global singleton Tracer object.
// Configure 100% sample rate, otherwise, few traces will be sampled.
const tracer = tracing.start({samplingRate: 1}).tracer;

function main() {
  // Create a span. A span must be closed.
  tracer.startRootSpan({name: 'main'}, rootSpan => {
    doWork();
    rootSpan.end();
  });
}

function doWork() {
  console.log('doing busy work');
}

main();
