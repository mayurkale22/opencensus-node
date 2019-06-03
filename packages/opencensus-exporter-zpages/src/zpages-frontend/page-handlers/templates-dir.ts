/**
 * Copyright 2019 OpenCensus Authors.
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

import * as path from 'path';

/** The directory to search for templates. */
export const templatesDir = (function getTemplatesDir() {
  // When this file is compiled to JS, it will live in the 'build' dir which
  // is a peer of 'templates'.  Tests don't compile, so the relative path is
  // different.
  if (path.basename(path.join(__dirname, '../../..')) === 'build') {
    return path.join(__dirname, '../../../../templates');
  }
  return path.join(__dirname, '../../../templates');
})();
