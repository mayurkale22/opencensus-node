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

import {BucketOptions, DistributionBucket, DistributionValue, LabelKey, LabelValue, Metric as OCMetric, MetricDescriptor as OCMetricDescriptor, MetricDescriptor, MetricDescriptorType, TimeSeriesPoint, Timestamp} from '@opencensus/core';
import {Counter, Gauge, Histogram, Metric, Registry} from 'prom-client';

// Histogram cannot have a label named 'le'
const RESERVED_HISTOGRAM_LABEL = 'le';

/** Creates a Metric using the LabelKeys and LabelValues. */
export function createMetric(
    metricDescriptor: MetricDescriptor, metricPrefix: string): Metric {
  // Create a new metric if there is no one
  const metricObj = {
    name: createMetricName(metricDescriptor.name, metricPrefix),
    help: metricDescriptor.description,
    labelNames: createLabelNames(metricDescriptor.labelKeys)
  };
  // Creating the metric based on MetricDescriptorType
  let metric;
  switch (metricDescriptor.type) {
    case MetricDescriptorType.CUMULATIVE_INT64:
    case MetricDescriptorType.CUMULATIVE_DOUBLE:
      metric = new Counter(metricObj);
      break;
    case MetricDescriptorType.GAUGE_INT64:
    case MetricDescriptorType.GAUGE_DOUBLE:
      metric = new Gauge(metricObj);
      break;
    case MetricDescriptorType.CUMULATIVE_DISTRIBUTION:
    case MetricDescriptorType.GAUGE_DISTRIBUTION:
      validateDisallowedLeLabelForHistogram(metricObj.labelNames);
      // const distribution = {
      //   name: metricName,
      //   help: view.description,
      //   labelNames: labels,
      //   buckets: this.getBoundaries(view, tags)
      // };
      const distribution = Object.assign({}, metricObj, {buckets: []});
      metric = new Histogram(distribution);
      break;
    default:
      throw Error(`Aggregation %s is not supported : ${metricDescriptor.type}`);
  }
  return metric;
}

/** Creates Metric name. */
export function createMetricName(name: string, metricPrefix: string): string {
  if (metricPrefix) {
    return sanitizePrometheusMetricName(`${metricPrefix}_${name}`);
  } else {
    return sanitizePrometheusMetricName(name);
  }
}

export function createLabelValues(
    labelKeys: LabelKey[], labelValues: LabelValue[]) {
  const labels: {[key: string]: string} = {};
  for (let i = 0; i < labelValues.length; i++) {
    const value = labelValues[i].value;
    if (value && labelKeys[i]) {
      labels[labelKeys[i].key] = value;
    } else {
      // TODO(mayurkale) : consider to throw an error when LabelValue and
      // LabelKey lengths are not same.
    }
  }
  return labels;
}

/**
 * Converts the list of label keys to a list of string label names. Also
 * sanitizes the label keys.
 */
export function createLabelNames(labelKeys: LabelKey[]): string[] {
  return labelKeys.map(labelKey => {
    return sanitizePrometheusMetricName(labelKey.key);
  });
}

/**
 * Sanitize metric name.
 * Please note that Prometheus Metric and Label name can only have
 * alphanumeric characters and underscore. All other characters will be
 * sanitized by underscores.
 */
function sanitizePrometheusMetricName(name: string): string {
  // replace all characters other than [A-Za-z0-9_].
  return name.replace(/\W/g, '_');
}

/** Throws an error if there is an 'le' label name histogram label names */
function validateDisallowedLeLabelForHistogram(labels: string[]) {
  labels.forEach(label => {
    if (label === RESERVED_HISTOGRAM_LABEL) {
      throw Error(
          'Prometheus Histogram cannot have a label named \'le\' because it is a reserved label for bucket boundaries. Please remove this key from your view.');
    }
  });
}

export function millisFromTimestamp(timestamp: Timestamp): number {
  return timestamp.seconds * 1e3 + Math.floor(timestamp.nanos / 1e6);
}

export const TEST_ONLY = {
  createLabelNames,
  createMetricName,
  validateDisallowedLeLabelForHistogram
};
