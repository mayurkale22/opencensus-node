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

import {Clock} from '../../internal/clock';
import {LabelKey, Metric, MetricDescriptor, MetricDescriptorType} from '../export/types';
import {Meter} from '../gauges/meter';

export class Gauge implements Meter {
  private metricDescriptor: MetricDescriptor = null;
  private labelKeysSize: number;

  constructor(
      name: string, description: string, unit: string,
      type: MetricDescriptorType, labelKeys: LabelKey[]) {
    this.metricDescriptor = {name, description, unit, type, labelKeys};
    this.labelKeysSize = labelKeys.length;
  }

  getMetric(clock: Clock): Metric {
    return null;
  }
}
