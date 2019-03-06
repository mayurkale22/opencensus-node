# Lesson 1 - Quickstart

## Objectives

Learn how to:

* Instantiate a Tracer
* Create a simple trace

## Walkthrough

### A simple Hello-World program

First, let’s create a folder called exercise and navigate inside it and create a simple Node program `hello.js`.

```
mkdir -p lesson01/exercise
touch lesson01/exercise/hello.js
```

In lesson01/exercise/hello.js:

```javascript
function main() {
  console.log('main');
    doWork();
  });
}

function doWork() {
  console.log('doing busy work');
}

main();
```

Run it:

```
$ node lesson01/exercise/hello.js
main
doing busy work

```

### Enable/Create Trace

A trace is a [directed acyclic graph](https://en.wikipedia.org/wiki/Directed_acyclic_graph) of spans. A span represents a single operation in a trace. A span could be representative of an HTTP request, a remote procedure call (RPC), a database query, or even the path that a code takes in user code, etc. The more info on Span available at [here](https://opencensus.io/tracing/span/).

Let's create a trace that consists of just a single span. To start a trace, you first need to get a reference to the `Tracer`.
We can use a global instance returned by `tracing.start().tracer`. The object returned by start() may be used to create custom trace spans.

```javascript
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
```

We are using the following basic features of the OpenCensus API:

* a `tracer` instance is used to start new spans via the `startRootSpan` function
* each `span` is given a name. A span name is a string descriptive of what the span does, `"main"` in this case.
* each `span` must be finished by calling its `end()` function
* the start and end timestamps of the span will be captured automatically by the tracer implementation

## Conclusion

The complete program can be found in the [solution](./solution) directory.

Next lesson: [Multi Tracing with Annotations and Attributes](../lesson02).

## Useful links
- For more information on OpenCensus, visit: <https://opencensus.io/>
- To checkout the OpenCensus for Node.js, visit: <https://github.com/census-instrumentation/opencensus-node>

## LICENSE

Apache License 2.0
