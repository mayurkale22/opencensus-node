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

import {AggregationType, DistributionData, ExporterConfig, logger, Logger, Measurement, MeasureUnit, StatsEventListener, Tags, View} from '@opencensus/core';
import {DistributionValue, Metric as OCMetric, MetricProducerManager, Metrics} from '@opencensus/core';
import * as express from 'express';
import * as http from 'http';
import {Counter, Gauge, Histogram, Metric, Registry} from 'prom-client';

import {createLabelValues, createMetric, createMetricName} from './prometheus-stats-utils';

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
    contentType: 'text/plain; text/plain; version=0.0.4; charset=utf-8',
    prefix: ''
  };
  private timer: NodeJS.Timer;
  private logger: Logger;
  private prefix: string;
  private port: number;
  private app = express();
  private server: http.Server;
  // Registry instance from Prometheus to keep the metrics
  private registry = new Registry();

  // Histogram cannot have a label named 'le'
  private static readonly RESERVED_HISTOGRAM_LABEL = 'le';

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

  /**
   * Starts the Prometheus exporter that polls Metric from Metrics library and
   * send batched data to backend.
   */
  start(): void {
    this.timer = setInterval(async () => {
      try {
        console.log('Running prometheus exporter');
        await this.export();
      } catch (err) {
        throw Error(err);
      }
    }, 30000);
  }

  async export() {
    const metricProducerManager: MetricProducerManager =
        Metrics.getMetricProducerManager();

    for (const metricProducer of metricProducerManager.getAllMetricProducer()) {
      for (const metric of metricProducer.getMetrics()) {
        console.log(`metric : ${JSON.stringify(metric)}`);
        const descriptor = metric.descriptor;
        const metricName = createMetricName(descriptor.name, this.prefix);
        /** Get metric if already registered */
        let registeredMetric = this.registry.getSingleMetric(metricName);
        console.log(`${metricName} Already there : ${registeredMetric}`);
        for (const timeseries of metric.timeseries) {
          console.log(`timeseries : ${JSON.stringify(timeseries)}`);
          if (!registeredMetric) {
            const newMetric = createMetric(descriptor, this.prefix);
            this.registry.registerMetric(newMetric);
            registeredMetric = newMetric;
          }

          const labelValues =
              createLabelValues(descriptor.labelKeys, timeseries.labelValues);
          // Updating the metric based on metric instance type
          if (registeredMetric instanceof Counter) {
            for (const point of timeseries.points) {
              registeredMetric.inc(labelValues, point.value as number);
            }
          } else if (registeredMetric instanceof Gauge) {
            for (const point of timeseries.points) {
              registeredMetric.set(labelValues, point.value as number);
            }
          } else if (registeredMetric instanceof Histogram) {
            for (const point of timeseries.points) {
              // registeredMetric.observe(labelValues, (point.value as
              // DistributionValue).);
            }
          } else {
            this.logger.error('Metric not supported');
          }
        }
      }
    }

    console.log('finished');
  }

  /**
   * Start the Prometheus exporter server
   */
  startServer(callback?: () => void) {
    const self = this;
    this.app.get('/metrics', (req, res) => {
      res.set(
          'Content-Type', PrometheusStatsExporter.DEFAULT_OPTIONS.contentType);
      res.end(this.registry.metrics());
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
}
