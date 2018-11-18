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

import {PreConditions} from '../../common/preconditions';
import {Clock} from '../../internal/clock';
import {MeasureUnit} from '../../stats/types';
import {LabelKey, MetricDescriptorType} from '../export/types';
import {DerivedGauge} from '../gauges/derived-gauge';
import {Gauge} from '../gauges/gauge';
import {Meter} from '../gauges/meter';

/**
 * Creates and manages your application's set of metrics.
 */
export class MetricRegistry {
  private clock: Clock = null;

  private registeredMeters: Map<string, Meter> = new Map();

  /**
   * Creates MetricRegistry
   * @param a Clock.
   */
  constructor(clock: Clock) {
    this.clock = clock;
  }

  /**
   * Builds a new Int64 gauge to be added to the registry. This is more
   * convenient form when you want to manually increase and decrease values as
   * per your service requirements.
   *
   * @param name the name of the metric.
   * @param description the description of the metric.
   * @param unit the unit of the metric.
   * @param labelKeys the list of the label keys.
   * @return a Gauge.
   */
  addInt64Gauge(
      name: string, description: string, unit: MeasureUnit,
      labelKeys: LabelKey[]): Gauge {
    PreConditions.checkListElementNotNull(
        PreConditions.checkNotNull(labelKeys, 'labelKeys'), 'labelKey');

    const gauge = new Gauge(
        PreConditions.checkNotNull(name, 'name'),
        PreConditions.checkNotNull(description, 'description'),
        PreConditions.checkNotNull(unit, 'unit'),
        MetricDescriptorType.GAUGE_INT64, labelKeys);

    this.registeredMeters.set(name, gauge);
    return gauge;
  }

  /**
   * Builds a new double gauge to be added to the registry. This is more
   * convenient form when you want to manually increase and decrease values as
   * per your service requirements.
   *
   * @param name the name of the metric.
   * @param description the description of the metric.
   * @param unit the unit of the metric.
   * @param labelKeys the list of the label keys.
   * @return a Gauge.
   */
  addDoubleGauge(
      name: string, description: string, unit: MeasureUnit,
      labelKeys: LabelKey[]): Gauge {
    PreConditions.checkListElementNotNull(
        PreConditions.checkNotNull(labelKeys, 'labelKeys'), 'labelKey');

    const gauge = new Gauge(
        PreConditions.checkNotNull(name, 'name'),
        PreConditions.checkNotNull(description, 'description'),
        PreConditions.checkNotNull(unit, 'unit'),
        MetricDescriptorType.GAUGE_DOUBLE, labelKeys);
    this.registeredMeters.set(name, gauge);
    return gauge;
  }

  /**
   * Builds a new derived Int64 gauge to be added to the registry. This is more
   * convenient form when you want to manually increase and decrease values as
   * per your service requirements.
   *
   * @param name the name of the metric.
   * @param description the description of the metric.
   * @param unit the unit of the metric.
   * @param labelKeys the list of the label keys.
   * @return a DerivedGauge.
   */
  addDerivedInt64Gauge(
      name: string, description: string, unit: MeasureUnit,
      labelKeys: LabelKey[]): void {
    PreConditions.checkListElementNotNull(
        PreConditions.checkNotNull(labelKeys, 'labelKeys'), 'labelKey');

    const gauge = new DerivedGauge(
        PreConditions.checkNotNull(name, 'name'),
        PreConditions.checkNotNull(description, 'description'),
        PreConditions.checkNotNull(unit, 'unit'),
        MetricDescriptorType.GAUGE_INT64, labelKeys);
    this.registeredMeters.set(name, gauge);
  }

  /**
   * Builds a new derived double gauge to be added to the registry. This is more
   * convenient form when you want to manually increase and decrease values as
   * per your service requirements.
   *
   * @param name the name of the metric.
   * @param description the description of the metric.
   * @param unit the unit of the metric.
   * @param labelKeys the list of the label keys.
   * @return a DerivedGauge.
   */
  addDerivedDoubleGauge(
      name: string, description: string, unit: MeasureUnit,
      labelKeys: LabelKey[]): void {
    PreConditions.checkListElementNotNull(
        PreConditions.checkNotNull(labelKeys, 'labelKeys'), 'labelKey');

    const gauge = new DerivedGauge(
        PreConditions.checkNotNull(name, 'name'),
        PreConditions.checkNotNull(description, 'description'),
        PreConditions.checkNotNull(unit, 'unit'),
        MetricDescriptorType.GAUGE_DOUBLE, labelKeys);
    this.registeredMeters.set(name, gauge);
  }
}
