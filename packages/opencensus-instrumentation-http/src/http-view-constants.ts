/**
 * Copyright 2019, OpenCensus Authors
 *
 * Licensed under the Apache License, Version 2.0 the "License";
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
const {Stats, MeasureUnit, AggregationType} = require('@opencensus/core');

const stats = new Stats();

// Client tag keys.

// Tag for the client-side HTTP method of the request, capitalized (GET, POST,
// etc.).
const HTTP_CLIENT_METHOD = 'http_client_method';

// Tag for the client-side URL path (not including query string) in the request.
const HTTP_CLIENT_PATH = 'http_client_path';

// Tag for the numeric client-side HTTP response status code (e.g. 200, 404,
// 500). If a transport error occurred and no status code was read, use "error"
// as the Tag Value.
const HTTP_CLIENT_STATUS = 'http_client_status';

// Tag for the value of the client-side HTTP host header.
const HTTP_CLIENT_HOST = 'http_client_host';

// View for size distribution of client-side HTTP request body.
const HTTP_CLIENT_SENT_BYTES_VIEW = stats.createView(
    'opencensus.io/http/client/sent_bytes', mLatencyMs,
    AggregationType.DISTRIBUTION, [HTTP_CLIENT_METHOD, HTTP_CLIENT_PATH],
    'Size distribution of client-side HTTP request body', [
      0, 1024, 2048, 4096, 16384, 65536, 262144, 1048576, 4194304, 16777216,
      67108864, 268435456, 1073741824, 4294967296
    ]);
