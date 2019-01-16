/**
 * Copyright 2019, OpenCensus Authors
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
import * as assert from 'assert';

import {createLabelNames, createMetricName, validateDisallowedLeLabelForHistogram} from '../src/prometheus-stats-utils';

describe('createLabelNames()', () => {
  it('should return a label names', () => {
    const labelKeys = [
      {'key': 'key1', 'description': 'desc'},
      {'key': 'key2', 'description': 'desc'}
    ];
    const labelNames = createLabelNames(labelKeys);
    assert.equal(labelNames.length, 2);
    assert.deepStrictEqual(labelNames, ['key1', 'key2']);
  });
  it('should return a label names after sanitize', () => {
    const labelKeys = [
      {'key': 'key1/name', 'description': 'desc'},
      {'key': 'key2-name', 'description': 'desc'}
    ];
    const labelNames = createLabelNames(labelKeys);
    assert.equal(labelNames.length, 2);
    assert.deepStrictEqual(labelNames, ['key1_name', 'key2_name']);
  });
});
describe('createMetricName()', () => {
  const name = 'my_metric';
  const metricPrefix = 'opencensus';
  it('should return a metric name', () => {
    assert.equal(createMetricName(name, null), name);
  });
  it('should return a metric name with prefix', () => {
    assert.equal(
        createMetricName(name, metricPrefix), `${metricPrefix}_${name}`);
  });
  it('should return a metric name after sanitize', () => {
    assert.equal(
        createMetricName('demo/latency', metricPrefix),
        `${metricPrefix}_demo_latency`);
  });
  describe('validateDisallowedLeLabelForHistogram()', () => {
    it('should throw an error when there is an \'le\' in label names', () => {
      assert.throws(() => {
        validateDisallowedLeLabelForHistogram(['key1', 'le']);
      }, /^Error: Prometheus Histogram cannot have a label named 'le' because it is a reserved label for bucket boundaries. Please remove this key from your view.$/);
    });
  });
});
