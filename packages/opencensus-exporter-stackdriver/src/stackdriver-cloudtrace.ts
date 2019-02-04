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

import {Exporter, ExporterBuffer, RootSpan, Span as OCSpan, SpanContext} from '@opencensus/core';
import {logger, Logger} from '@opencensus/core';
import {auth, JWT} from 'google-auth-library';
import {google} from 'googleapis';

// TODO change to use import when types for hex2dec will be available
const {hexToDec}: {[key: string]: (input: string) => string} =
    require('hex2dec');
import {StackdriverExporterOptions, SpansWithCredentials, Span, AttributeValue} from './types';
import {generateLinks, generateAttributes, generateTimeEvents, stringToTruncatableString, getResourceLabels} from './stackdriver-cloudtrace-utils';
import {getDefaultResource} from './common-utils';

google.options({headers: {'x-opencensus-outgoing-request': 0x1}});
const cloudTrace = google.cloudtrace('v2');

/** Format and sends span information to Stackdriver */
export class StackdriverTraceExporter implements Exporter {
  projectId: string;
  exporterBuffer: ExporterBuffer;
  logger: Logger;
  failBuffer: SpanContext[] = [];
  private RESOURCE_LABELS: Promise<Record<string, AttributeValue>>;

  constructor(options: StackdriverExporterOptions) {
    this.projectId = options.projectId;
    this.logger = options.logger || logger.logger();
    this.exporterBuffer = new ExporterBuffer(this, options);
    this.RESOURCE_LABELS =
        getResourceLabels(getDefaultResource(this.projectId));
  }

  /**
   * Is called whenever a span is ended.
   * @param root the ended span
   */
  onEndSpan(root: RootSpan) {
    this.exporterBuffer.addToBuffer(root);
  }

  /** Not used for this exporter */
  onStartSpan(root: RootSpan) {}

  /**
   * Publishes a list of root spans to Stackdriver.
   * @param rootSpans
   */
  publish(rootSpans: RootSpan[]) {
    const spanList: Span[] = [];
    let resourceLabel: Record<string, AttributeValue>;
    (async () => {
      resourceLabel = await this.RESOURCE_LABELS;
    })();

    rootSpans.forEach(rootSpan => {
      // RootSpan data
      spanList.push(this.generateSpan(rootSpan, resourceLabel));
      rootSpan.spans.forEach(span => {
        // Builds spans data
        spanList.push(this.generateSpan(span, resourceLabel));
      });
    });

    return this.authorize(spanList)
        .then((spans: SpansWithCredentials) => {
          return this.batchWriteSpans(spans);
        })
        .catch(err => {
          for (const root of rootSpans) {
            this.failBuffer.push(root.spanContext);
          }
          return err;
        });
  }

  private generateSpan(
      span: OCSpan, resourceLabels: Record<string, AttributeValue>): Span {
    const spanName =
        `projects/${this.projectId}/traces/${span.traceId}/spans/${span.id}`;

    const spanBuilder: Span = {
      name: spanName,
      displayName: stringToTruncatableString(span.name),
      spanId: span.id,
      startTime: span.startTime.toISOString(),
      endTime: span.endTime.toISOString(),
      sameProcessAsParentSpan: !span.remoteParent,
      links: generateLinks(span.links),
      attributes: generateAttributes(span.attributes, resourceLabels),
      timeEvents: generateTimeEvents(span.annotations, span.messageEvents),
      childSpanCount: null,
      status: {code: span.status.code, message: span.status.message}
    };
    if (span.parentSpanId) {
      spanBuilder.parentSpanId = span.parentSpanId;
    }
    return spanBuilder;
  }

  /**
   * Sends new spans to new or existing traces in the Stackdriver format to the
   * service.
   * @param spans
   */
  private batchWriteSpans(spans: SpansWithCredentials) {
    return new Promise((resolve, reject) => {
      cloudTrace.projects.traces.batchWrite(spans, (err: Error) => {
        if (err) {
          err.message = `batchWriteSpans error: ${err.message}`;
          this.logger.error(err.message);
          reject(err);
        } else {
          const successMsg = 'batchWriteSpans sucessfully';
          this.logger.debug(successMsg);
          resolve(successMsg);
        }
      });
    });
  }

  /**
   * Gets the Google Application Credentials from the environment variables,
   * authenticates the client and calls a method to send the spans data.
   * @param stackdriverTraces
   */
  private authorize(stackdriverSpans: Span[]) {
    return auth.getApplicationDefault()
        .then((client) => {
          let authClient = client.credential as JWT;

          if (authClient.createScopedRequired &&
              authClient.createScopedRequired()) {
            const scopes = ['https://www.googleapis.com/auth/cloud-platform'];
            authClient = authClient.createScoped(scopes);
          }

          const spans: SpansWithCredentials = {
            name: `projects/${this.projectId}`,
            resource: {spans: stackdriverSpans},
            auth: authClient
          };
          return spans;
        })
        .catch((err) => {
          err.message = `authorize error: ${err.message}`;
          this.logger.error(err.message);
          throw (err);
        });
  }
}
