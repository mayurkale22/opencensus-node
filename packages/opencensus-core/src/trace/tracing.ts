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

import * as extend from 'extend';

import * as logger from '../common/console-logger';
import {Logger} from '../common/types';
import {ConsoleExporter} from '../exporters/console-exporter';
import {Exporter} from '../exporters/types';

import {defaultConfig} from './config/default-config';
import {Config} from './config/types';
import {Constants} from './constants';
import {PluginLoader} from './instrumentation/plugin-loader';
import {PluginNames} from './instrumentation/types';
import {CoreTracer} from './model/tracer';
import {Tracer} from './model/types';
import {Tracing} from './types';


/** Implements a Tracing. */
export class BaseTracing implements Tracing {
  /** A tracer object */
  readonly tracer: Tracer;
  /** A plugin loader object */
  private pluginLoader: PluginLoader;
  /** Plugin names */
  private defaultPlugins: PluginNames;
  /** A configuration object to start the tracing */
  private configLocal: Config = {};
  /** An object to log information to */
  private logger: Logger = null;
  /** Singleton instance */
  private static singletonInstance: Tracing;
  /** Indicates if the tracing is active */
  private activeLocal: boolean;

  /** Constructs a new TracingImpl instance. */
  constructor() {
    this.tracer = new CoreTracer();
    this.defaultPlugins = PluginLoader.defaultPluginsFromArray(
        Constants.DEFAULT_INSTRUMENTATION_MODULES);
  }

  /** Gets the tracing instance. */
  static get instance(): Tracing {
    return this.singletonInstance || (this.singletonInstance = new this());
  }

  /** Gets active status  */
  get active(): boolean {
    return this.activeLocal;
  }

  /** Gets config */
  get config(): Config {
    return this.configLocal;
  }

  /**
   * Starts tracing.
   * @param userConfig A configuration object to start tracing.
   * @returns The started Tracing instance.
   */
  start(userConfig?: Config): Tracing {
    this.configLocal = extend(
        true, {}, defaultConfig, {plugins: this.defaultPlugins}, userConfig);

    this.logger =
        this.configLocal.logger || logger.logger(this.configLocal.logLevel);
    this.configLocal.logger = this.logger;
    this.logger.debug('config: %o', this.configLocal);
    this.pluginLoader = new PluginLoader(this.logger, this.tracer);
    this.pluginLoader.loadPlugins(this.configLocal.plugins as PluginNames);

    if (!this.configLocal.exporter) {
      const exporter = new ConsoleExporter(this.configLocal);
      this.registerExporter(exporter);
    } else {
      this.registerExporter(this.configLocal.exporter);
    }
    this.activeLocal = true;
    this.tracer.start(this.configLocal);
    return this;
  }

  /** Stops the tracing. */
  stop() {
    this.activeLocal = false;
    this.tracer.stop();
    this.pluginLoader.unloadPlugins();
    this.configLocal = {};
    this.logger = null;
  }


  /** Gets the exporter. */
  get exporter(): Exporter {
    return this.configLocal.exporter ? this.configLocal.exporter as Exporter :
                                       null;
  }

  /**
   * Registers an exporter to send the collected traces to.
   * @param exporter The exporter to send the traces to.
   */
  registerExporter(exporter: Exporter): Tracing {
    if (this.configLocal.exporter) {
      this.unregisterExporter(this.configLocal.exporter);
    }
    if (exporter) {
      this.configLocal.exporter = exporter;
      this.tracer.registerSpanEventListener(exporter);
    }
    return this;
  }


  /**
   * Unregisters an exporter.
   * @param exporter The exporter to stop sending traces to.
   */
  unregisterExporter(exporter: Exporter): Tracing {
    this.tracer.unregisterSpanEventListener(exporter);
    this.configLocal.exporter = null;
    return this;
  }
}
