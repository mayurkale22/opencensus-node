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

import {checkArgument, checkListElementNotNull, checkNotNull} from '../../common/validations';
import {LabelKey, LabelValue, Metric, MetricDescriptor, MetricDescriptorType, Point, TimeSeries} from '../export/types';
import * as types from '../gauges/types';
import {hashLabelValues, initializeDefaultLabels} from '../utils';

export class Gauge implements types.Meter {
  private readonly metricDescriptor: MetricDescriptor;
  private labelKeysSize: number;
  private defaultLabelValues: LabelValue[];
  private registeredPoints: Map<string, types.Point> = new Map();

  constructor(
      private name: string, private description: string, private unit: string,
      private type: MetricDescriptorType,
      private readonly labelKeys: LabelKey[]) {
    this.metricDescriptor = {name, description, unit, type, labelKeys};
    this.labelKeysSize = labelKeys.length;
    this.defaultLabelValues = initializeDefaultLabels(this.labelKeysSize);
  }

  /**
   * Creates a TimeSeries and returns a Point if the specified
   * labelValues is not already associated with this gauge, else returns an
   * existing Point.
   *
   * It is recommended to keep a reference to the Point instead of always
   * calling this method for manual operations.
   *
   * @param {LabelValue[]} labelValues The list of the label values.
   * @returns {Point} The value of single gauge.
   */
  getOrCreateTimeSeries(labelValues: LabelValue[]): types.Point {
    checkListElementNotNull(
        checkNotNull(labelValues, 'labelValues'), 'labelValue');
    return this.registerTimeSeries(labelValues);
  }

  /**
   * Returns a Point for a gauge with all labels not set, or default
   * labels.
   *
   * @returns {Point} The value of single gauge.
   */
  getDefaultTimeSeries(): types.Point {
    return this.registerTimeSeries(this.defaultLabelValues);
  }

  /**
   * Removes the TimeSeries from the gauge metric, if it is present. i.e.
   * references to previous Point objects are invalid (not part of the
   * metric).
   *
   * @param {LabelValue[]} labelValues The list of label values.
   */
  removeTimeSeries(labelValues: LabelValue[]): void {
    checkNotNull(labelValues, 'labelValues');
    this.registeredPoints.delete(hashLabelValues(labelValues));
  }

  /**
   * Removes all TimeSeries from the gauge metric. i.e. references to all
   * previous Point objects are invalid (not part of the metric).
   */
  clear(): void {
    this.registeredPoints.clear();
  }

  private registerTimeSeries(labelValues: LabelValue[]): types.Point {
    const hash = hashLabelValues(labelValues);
    if (this.registeredPoints.has(hash)) {
      return this.registeredPoints.get(hash);
    }

    checkArgument(
        this.labelKeysSize === labelValues.length,
        'Label Keys and Label Values don\'t have same size');
    const point = new PointEntry(labelValues);
    this.registeredPoints.set(hash, point);
    return point;
  }

  getMetric(): Metric {
    // time at which the gauge is recorded - format: milliseconds since epoch
    const now = Date.now();
    if (this.registeredPoints.size === 0) {
      return null;
    }
    const timeSeriesList: TimeSeries[] = new Array();
    this.registeredPoints.forEach((point: types.Point) => {
      timeSeriesList.push(point.getTimeSeries(now));
    });
    return {descriptor: this.metricDescriptor, timeseries: timeSeriesList};
  }
}

/**
 * The value of a single point in the Gauge.TimeSeries.
 */
export class PointEntry implements types.Point {
  private value = 0;

  constructor(private readonly labelValues: LabelValue[]) {
    this.labelValues = labelValues;
  }

  /**
   * Adds the given value to the current value. The values can be negative.
   *
   * @param {number} amt The value to add.
   */
  add(amt: number): void {
    this.value = this.value + amt;
  }

  /**
   * Sets the given value.
   *
   * @param  {number} val The new value.
   */
  set(val: number): void {
    this.value = val;
  }

  /**
   * @param {number} timestamp The time at which the gauge is recorded.
   * @returns {TimeSeries} The TimeSeries.
   */
  getTimeSeries(timestamp: number): TimeSeries {
    const point: Point = {value: this.value, timestamp};
    return {
      labelValues: this.labelValues,
      points: [point],
      startTimestamp: null
    };
  }
}
