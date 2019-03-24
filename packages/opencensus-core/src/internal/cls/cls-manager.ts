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

import {EventEmitter} from 'events';
import * as semver from 'semver';
import { CLS, Func } from './base';
import { AsyncHooksCLS } from './async-hooks';
import { AsyncListenerCLS } from './async-listener';

const asyncHooksAvailable = semver.satisfies(process.version, '>=8');

export class TraceCLS implements CLS {
  private contextManager: CLS;
  private enabled = false;

  constructor() {
    if (asyncHooksAvailable) {
      this.contextManager = new AsyncHooksCLS();
    } else{
      this.contextManager = new AsyncListenerCLS();
    }
    this.contextManager.enable();
    this.enabled = true;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  enable(): void {
    if (!this.enabled) {
      this.contextManager.enable();
    }
    this.enabled = true;
  }

  disable(): void {
    if (this.enabled) {
      this.contextManager.disable();
    }
    this.enabled = false;
  }

  getContext() {
    return this.contextManager.getContext();
  }

  runWithContext<T>(fn: Func<T>, value: T): T {
    return this.contextManager.runWithContext(fn, value);
  }

  bindWithCurrentContext<T>(fn: Func<T>): Func<T> {
    return this.contextManager.bindWithCurrentContext(fn);
  }

  patchEmitterToPropagateContext<T>(ee: EventEmitter): void {
    this.contextManager.patchEmitterToPropagateContext(ee);
  }
}

export const cls = new TraceCLS();
