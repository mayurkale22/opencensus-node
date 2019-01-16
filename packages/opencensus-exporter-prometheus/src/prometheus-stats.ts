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

import {ExporterConfig, logger, Logger, Measurement, Metric as OcMetric, StatsEventListener, Timestamp, View} from '@opencensus/core';
import {DistributionValue, MetricDescriptor, MetricProducerManager, Metrics} from '@opencensus/core';
import * as express from 'express';
import * as http from 'http';
import {Counter, Gauge, labelValues, Registry} from 'prom-client';
import {createLabelNames, createLabelValues, createMetricName, isCumulativeMetricType, isDistributionMetricType, isGaugeMetricType, validateDisallowedLeLabelForHistogram} from './prometheus-stats-utils';

const HISTOGRAM_SUFFIX_SUM = '_sum';
const HISTOGRAM_SUFFIX_COUNT = '_count';
const HISTOGRAM_SUFFIX_BUCKET = '_bucket';
const LABEL_NAME_BUCKET_BOUND = 'le';
const INF_LABEL = '+Inf';

/**
 * Options for Prometheus configuration
 */
export interface PrometheusExporterOptions extends ExporterConfig {
  /** App prefix for metrics, if needed - default opencensus */
  prefix?: string;
  /**
   * Port number for Prometheus exporter server
   * Default registered port is 9464:
   * https://github.com/prometheus/prometheus/wiki/Default-port-allocations
   */
  port?: number;
  /**
   * Define if the Prometheus exporter server will be started - default false
   */
  startServer?: boolean;
}

/** Format and sends Stats to Prometheus exporter */
export class PrometheusStatsExporter implements StatsEventListener {
  static readonly DEFAULT_OPTIONS = {
    port: 9464,
    startServer: false,
    contentType: 'text/plain; version=0.0.4; charset=utf-8',
    prefix: ''
  };
  private logger: Logger;
  private prefix: string;
  private port: number;
  private app = express();
  private server: http.Server;
  // Registry instance from Prometheus to keep the metrics
  private registry = new Registry();

  constructor(options: PrometheusExporterOptions) {
    this.logger = options.logger || logger.logger();
    this.port = options.port || PrometheusStatsExporter.DEFAULT_OPTIONS.port;
    this.prefix =
        options.prefix || PrometheusStatsExporter.DEFAULT_OPTIONS.prefix;

    /** Start the server if the startServer option is true */
    if (options.startServer) {
      this.startServer();
    }
  }

  /**
   * Not used because prometheues scrape data from '/metrics' endpoint.
   */
  start(): void {}

  /**
   * Polls Metric from Metrics library and send batched data to backend.
   */
  export(): string {
    const metricProducerManager: MetricProducerManager =
        Metrics.getMetricProducerManager();

    for (const metricProducer of metricProducerManager.getAllMetricProducer()) {
      for (const metric of metricProducer.getMetrics()) {
        this.registerMetric(metric);
      }
    }
    return this.registry.metrics();
  }

  registerMetric(metric: OcMetric) {
    const metricDescriptor = metric.descriptor;
    const labelNames: string[] = createLabelNames(metricDescriptor.labelKeys);
    for (const timeseries of metric.timeseries) {
      const labelValues =
          createLabelValues(metricDescriptor.labelKeys, timeseries.labelValues);

      for (const point of timeseries.points) {
        const type = metricDescriptor.type;
        if (isCumulativeMetricType(type)) {
          this.updateCounterMetric(
              metricDescriptor, point.value as number, labelNames, labelValues);
        } else if (isGaugeMetricType(type)) {
          this.updateGaugeMetric(
              metricDescriptor, point.value as number, labelNames, labelValues);
        } else if (isDistributionMetricType(type)) {
          validateDisallowedLeLabelForHistogram(labelNames);

          const distribution = point.value as DistributionValue;

          this.updateCounterMetric(
              metricDescriptor, distribution.count, labelNames, labelValues,
              HISTOGRAM_SUFFIX_COUNT);
          this.updateCounterMetric(
              metricDescriptor, distribution.sum, labelNames, labelValues,
              HISTOGRAM_SUFFIX_SUM);

          let cumulativeCount = 0;
          const labelNamesWithLe = Object.assign([], labelNames);
          const labelValuesWithLe = Object.assign({}, labelValues);

          labelNamesWithLe.push(LABEL_NAME_BUCKET_BOUND);
          const bounds = distribution.bucketOptions.explicit.bounds;
          for (let i = 0; i < distribution.buckets.length; i++) {
            // The label value of "le" is the upper inclusive bound.
            // For the last bucket, it should be "+Inf".
            const bucketBoundary =
                i < bounds.length ? bounds[i].toString() : INF_LABEL;

            labelValuesWithLe[LABEL_NAME_BUCKET_BOUND] = bucketBoundary;
            cumulativeCount += distribution.buckets[i].count;
            this.updateCounterMetric(
                metricDescriptor, cumulativeCount, labelNamesWithLe,
                labelValuesWithLe, HISTOGRAM_SUFFIX_BUCKET);
          }
        } else {
          throw Error(`Aggregation %s is not supported : ${type}`);
        }
      }
    }
  }

  private updateCounterMetric(
      metricDescriptor: MetricDescriptor, value: number, labelNames: string[],
      labelValues: labelValues, metricNameSuffix = '') {
    let counterMetric: Counter;
    const labelValuesCopy = Object.assign({}, labelValues);
    const fullMetricName = createMetricName(
        `${metricDescriptor.name}${metricNameSuffix}`, this.prefix);
    /** Get metric if already registered */
    const registeredMetric = this.registry.getSingleMetric(fullMetricName);
    if (registeredMetric instanceof Counter) {
      counterMetric = registeredMetric;
    } else {
      const metric = new Counter({
        name: fullMetricName,
        help: metricDescriptor.description,
        labelNames
      });
      this.registry.registerMetric(metric);
      counterMetric = metric;
    }
    counterMetric.inc(labelValuesCopy, value);
  }

  private updateGaugeMetric(
      metricDescriptor: MetricDescriptor, value: number, labelNames: string[],
      labelValues: labelValues, metricNameSuffix = '') {
    const fullMetricName = createMetricName(
        `${metricDescriptor.name}${metricNameSuffix}`, this.prefix);
    let gaugeMetric: Gauge;
    const labelValuesCopy = Object.assign({}, labelValues);
    /** Get metric if already registered */
    const registeredMetric = this.registry.getSingleMetric(fullMetricName);
    if (registeredMetric instanceof Gauge) {
      gaugeMetric = registeredMetric;
    } else {
      const metric = new Gauge({
        name: fullMetricName,
        help: metricDescriptor.description,
        labelNames
      });
      this.registry.registerMetric(metric);
      gaugeMetric = metric;
    }
    gaugeMetric.set(labelValuesCopy, value);
  }

  /**
   * Start the Prometheus exporter server
   */
  startServer(callback?: () => void) {
    const self = this;
    this.app.get('/metrics', (req, res) => {
      res.set(
          'Content-Type', PrometheusStatsExporter.DEFAULT_OPTIONS.contentType);
      res.end(this.export());
    });

    this.server = this.app.listen(this.port, () => {
      self.logger.debug('Prometheus Exporter started on port ' + self.port);
      if (callback) {
        callback();
      }
    });
  }

  /**
   * Stop the Prometheus exporter server
   * @param callback
   */
  stopServer(callback?: () => void) {
    if (this.server) {
      this.registry.clear();
      this.server.close(callback);
      this.logger.debug('Prometheus Exporter shutdown');
    }
  }

  // TODO(mayurkale): Deprecate onRegisterView and onRecord apis after
  // https://github.com/census-instrumentation/opencensus-node/issues/257
  /**
   * Not used because registering metrics requires information that is
   * present in Measurement objects
   * @param view
   */
  onRegisterView(view: View) {}

  /**
   * Method called every new stats' record
   * @param views
   * @param measurement
   */
  onRecord(views: View[], measurement: Measurement) {}
}
