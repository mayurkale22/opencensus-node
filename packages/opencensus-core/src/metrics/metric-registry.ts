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

import {checkListElementNotNull, checkNotNull} from '../common/validations';
import {MeasureUnit} from '../stats/types';
import {LabelKey, MetricDescriptorType} from './export/types';
import {Gauge} from './gauges/gauge';

/**
 * Creates and manages your application's set of metrics.
 */
export class MetricRegistry {
  /**
   * Builds a new Int64 gauge to be added to the registry. This is more
   * convenient form when you want to manually increase and decrease values as
   * per your service requirements.
   *
   * @param {string} name The name of the metric.
   * @param {string} description The description of the metric.
   * @param {MeasureUnit} unit The unit of the metric.
   * @param {LabelKey[]} labelKeys The list of the label keys.
   * @returns {Gauge} The Gauge.
   */
  addInt64Gauge(
      name: string, description: string, unit: MeasureUnit,
      labelKeys: LabelKey[]): Gauge {
    checkListElementNotNull(checkNotNull(labelKeys, 'labelKeys'), 'labelKey');
    const gauge = new Gauge(
        checkNotNull(name, 'name'), checkNotNull(description, 'description'),
        checkNotNull(unit, 'unit'), MetricDescriptorType.GAUGE_INT64,
        labelKeys);
    return gauge;
  }

  /**
   * Builds a new double gauge to be added to the registry. This is more
   * convenient form when you want to manually increase and decrease values as
   * per your service requirements.
   *
   * @param {string} name The name of the metric.
   * @param {string} description The description of the metric.
   * @param {MeasureUnit} unit The unit of the metric.
   * @param {LabelKey[]} labelKeys The list of the label keys.
   * @returns {Gauge} The Gauge.
   */
  addDoubleGauge(
      name: string, description: string, unit: MeasureUnit,
      labelKeys: LabelKey[]): Gauge {
    checkListElementNotNull(checkNotNull(labelKeys, 'labelKeys'), 'labelKey');
    const gauge = new Gauge(
        checkNotNull(name, 'name'), checkNotNull(description, 'description'),
        checkNotNull(unit, 'unit'), MetricDescriptorType.GAUGE_DOUBLE,
        labelKeys);
    return gauge;
  }

  /**
   * Builds a new derived Int64 gauge to be added to the registry. This is more
   * convenient form when you want to manually increase and decrease values as
   * per your service requirements.
   *
   * @param {string} name The name of the metric.
   * @param {string} description The description of the metric.
   * @param {MeasureUnit} unit The unit of the metric.
   * @param {LabelKey[]} labelKeys The list of the label keys.
   */
  addDerivedInt64Gauge(
      name: string, description: string, unit: MeasureUnit,
      labelKeys: LabelKey[]): void {
    checkListElementNotNull(checkNotNull(labelKeys, 'labelKeys'), 'labelKey');
    // TODO(mayurkale): Add Derived Int64Gauge.
  }

  /**
   * Builds a new derived double gauge to be added to the registry. This is more
   * convenient form when you want to manually increase and decrease values as
   * per your service requirements.
   *
   * @param {string} name The name of the metric.
   * @param {string} description The description of the metric.
   * @param {MeasureUnit} unit The unit of the metric.
   * @param {LabelKey[]} labelKeys The list of the label keys.
   */
  addDerivedDoubleGauge(
      name: string, description: string, unit: MeasureUnit,
      labelKeys: LabelKey[]): void {
    checkListElementNotNull(checkNotNull(labelKeys, 'labelKeys'), 'labelKey');
    // TODO(mayurkale): Add Derived DoubleGauge.
  }
}
