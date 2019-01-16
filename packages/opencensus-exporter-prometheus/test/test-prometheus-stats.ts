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

import {AggregationType, Measure, MeasureUnit, Metrics, Stats} from '@opencensus/core';
import * as assert from 'assert';
import * as http from 'http';

import {PrometheusStatsExporter} from '../src/';

describe('Prometheus Stats Exporter', () => {
  const options = {port: 9464, startServer: false};
  const prometheusServerUrl = `http://localhost:${options.port}/metrics`;
  const tags = {tagKey1: 'tagValue1'};
  const tagKeys = Object.keys(tags);
  let exporter: PrometheusStatsExporter;
  let stats: Stats;

  beforeEach((done) => {
    stats = new Stats();
    exporter = new PrometheusStatsExporter(options);
    exporter.startServer(done);
  });

  afterEach((done) => {
    exporter.stopServer(done);
    Metrics.getMetricProducerManager().removeAll();
  });

  it('should create a count aggregation', (done) => {
    const measure =
        stats.createMeasureDouble('testMeasureDouble', MeasureUnit.UNIT);
    stats.createView(
        'ocnodemetrics/countview', measure, AggregationType.COUNT, tagKeys,
        'A count aggregation example', null);
    const measurement = {measure, tags, value: 2};
    const measurement2 = {measure, tags, value: 3};
    stats.record(measurement, measurement2);

    http.get(prometheusServerUrl, (res) => {
          res.on('data', (chunk) => {
            const body = chunk.toString();
            const lines = body.split('\n');

            assert.equal(
                lines[0],
                '# HELP ocnodemetrics_countview A count aggregation example');
            assert.equal(lines[1], '# TYPE ocnodemetrics_countview counter');
            assert.equal(
                lines[2], 'ocnodemetrics_countview{tagKey1="tagValue1"} 2');
            done();
          });
        }).on('error', done);
  });

  it('should create a sum aggregation', (done) => {
    const measure =
        stats.createMeasureDouble('testMeasureDouble', MeasureUnit.UNIT);
    const tags = {tagKey1: 'tagValue1'};
    const tagKeys = Object.keys(tags);
    stats.createView(
        'ocnodemetrics/sumview', measure, AggregationType.SUM, tagKeys,
        'A sum aggregation example', null);
    const measurement = {measure, tags, value: 2};
    const measurement2 = {measure, tags, value: 3};
    stats.record(measurement, measurement2);

    http.get(prometheusServerUrl, (res) => {
          res.on('data', (chunk) => {
            const body = chunk.toString();
            const lines = body.split('\n');

            assert.equal(
                lines[0],
                '# HELP ocnodemetrics_sumview A sum aggregation example');
            assert.equal(lines[1], '# TYPE ocnodemetrics_sumview counter');
            assert.equal(
                lines[2],
                'ocnodemetrics_sumview{tagKey1="tagValue1"} 5',
            );
            done();
          });
        }).on('error', done);
  });

  it('should create a last value aggregation', (done) => {
    const measure =
        stats.createMeasureDouble('testMeasureDouble', MeasureUnit.UNIT);
    const tags = {tagKey1: 'tagValue1'};
    const tagKeys = Object.keys(tags);
    stats.createView(
        'ocnodemetrics/lastvalueview', measure, AggregationType.LAST_VALUE,
        tagKeys, 'A last value aggregation example', null);
    const measurement = {measure, tags, value: 2};
    const measurement2 = {measure, tags, value: 3};
    stats.record(measurement, measurement2);

    http.get(prometheusServerUrl, (res) => {
          res.on('data', (chunk) => {
            const body = chunk.toString();
            const lines = body.split('\n');

            assert.equal(
                lines[0],
                '# HELP ocnodemetrics_lastvalueview A last value aggregation example');
            assert.equal(lines[1], '# TYPE ocnodemetrics_lastvalueview gauge');
            assert.equal(
                lines[2], 'ocnodemetrics_lastvalueview{tagKey1="tagValue1"} 3');
            done();
          });
        }).on('error', done);
  });

  it('should create a distribution aggregation', (done) => {
    const measure =
        stats.createMeasureDouble('testMeasureDouble', MeasureUnit.UNIT);
    const tags = {tagKey1: 'tagValue1'};
    const tagKeys = Object.keys(tags);
    const boundaries = [10, 20, 30, 40];
    stats.createView(
        'ocnodemetrics/distributionview', measure, AggregationType.DISTRIBUTION,
        tagKeys, 'A distribution aggregation example', boundaries);
    const measurement = {measure, tags, value: 12};
    const measurement2 = {measure, tags, value: 31};
    stats.record(measurement, measurement2);

    http.get(prometheusServerUrl, (res) => {
          res.on('data', (chunk) => {
            const body = chunk.toString();
            const lines = body.split('\n');
            assert.equal(
                lines[0],
                '# HELP ocnodemetrics_distributionview_count A distribution aggregation example');
            assert.equal(
                lines[1],
                '# TYPE ocnodemetrics_distributionview_count counter');
            assert.equal(
                lines[2],
                'ocnodemetrics_distributionview_count{tagKey1="tagValue1"} 2');
            assert.equal(
                lines[4],
                '# HELP ocnodemetrics_distributionview_sum A distribution aggregation example');
            assert.equal(
                lines[5], '# TYPE ocnodemetrics_distributionview_sum counter');
            assert.equal(
                lines[6],
                'ocnodemetrics_distributionview_sum{tagKey1="tagValue1"} 43');
            assert.equal(
                lines[8],
                '# HELP ocnodemetrics_distributionview_bucket A distribution aggregation example');
            assert.equal(
                lines[9],
                '# TYPE ocnodemetrics_distributionview_bucket counter');
            assert.equal(
                lines[10],
                'ocnodemetrics_distributionview_bucket{tagKey1="tagValue1",le="10"} 0');
            assert.equal(
                lines[11],
                'ocnodemetrics_distributionview_bucket{tagKey1="tagValue1",le="20"} 1');
            assert.equal(
                lines[12],
                'ocnodemetrics_distributionview_bucket{tagKey1="tagValue1",le="30"} 1');
            assert.equal(
                lines[13],
                'ocnodemetrics_distributionview_bucket{tagKey1="tagValue1",le="40"} 2');
            assert.equal(
                lines[14],
                'ocnodemetrics_distributionview_bucket{tagKey1="tagValue1",le="+Inf"} 2');

            done();
          });
        }).on('error', done);
  });

  it('should throw error when labels contains "le" label name in histogram label names',
     () => {
       const measure =
           stats.createMeasureDouble('testMeasureDouble', MeasureUnit.UNIT);
       const tags = {le: 'tagValue1'};
       const tagKeys = Object.keys(tags);
       const boundaries = [10, 20, 30, 40];
       stats.createView(
           'ocnodemetrics/distributionview1', measure,
           AggregationType.DISTRIBUTION, tagKeys,
           'A distribution aggregation example', boundaries);

       const measurement = {measure, tags, value: 2};
       stats.record(measurement);

       assert.throws(() => {
         exporter.export();
       }, /^Error: Prometheus Histogram cannot have a label named 'le' because it is a reserved label for bucket boundaries. Please remove this key from your view.$/);
     });
});

describe('Prometheus Stats Exporter with prefix option', () => {
  const options = {port: 9464, startServer: false, prefix: 'opencensus'};
  const prometheusServerUrl = `http://localhost:${options.port}/metrics`;
  const tags = {le: 'tagValue1'};
  const tagKeys = Object.keys(tags);
  let exporter: PrometheusStatsExporter;
  let measure: Measure;
  let stats: Stats;

  before((done) => {
    stats = new Stats();
    measure = stats.createMeasureDouble('testMeasureDouble', MeasureUnit.UNIT);
    exporter = new PrometheusStatsExporter(options);
    exporter.startServer(done);
  });

  after((done) => {
    exporter.stopServer(done);
    Metrics.getMetricProducerManager().removeAll();
  });

  it('should create a count aggregation with le labels', (done) => {
    stats.createView(
        'test/key-1', measure, AggregationType.COUNT, tagKeys,
        'A count aggregation example', null);
    const measurement = {measure, tags, value: 2};
    const measurement2 = {measure, tags, value: 3};
    stats.record(measurement, measurement2);

    http.get(prometheusServerUrl, (res) => {
          res.on('data', (chunk) => {
            const body = chunk.toString();
            const lines = body.split('\n');

            assert.equal(
                lines[0],
                '# HELP opencensus_test_key_1 A count aggregation example');
            assert.equal(lines[1], '# TYPE opencensus_test_key_1 counter');
            assert.equal(lines[2], 'opencensus_test_key_1{le="tagValue1"} 2');
            done();
          });
        }).on('error', done);
  });
});
