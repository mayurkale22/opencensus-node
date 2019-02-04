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

import {Annotation as OCAnnotation, Attributes as OCAttributes, Link as OCLink, MessageEvent as OCMessageEvent, version} from '@opencensus/core';
// TODO change to use import when types for hex2dec will be available
const {hexToDec}: {[key: string]: (input: string) => string} =
    require('hex2dec');
import {TimeEvents, Link, Links, Attributes, AttributeValue, TruncatableString, TimeEvent, Type, MonitoredResource} from './types';

const AGENT_LABEL_KEY = 'g.co/agent';
const AGENT_LABEL_VALUE_STRING = `opencensus-node [${version}]`;
const AGENT_LABEL_VALUE = generateAttributeValue(AGENT_LABEL_VALUE_STRING);

/**
 * Generates StackDriver Links from OpenCensus Link.
 * @param links OCLink[]
 * @returns Links
 */
export function generateLinks(links: OCLink[]): Links {
  return {
    link: links.map((link) => generateLink(link)),
    // TODO(mayurkale): issues/316->enforce param limits and get dropped counts.
    droppedLinksCount: 0
  };
}

/**
 * Generates StackDriver Attributes from OpenCensus Attributes.
 * @param attributes OCAttributes
 * @param droppedAttributesCount number
 * @returns Attributes
 */
export function generateAttributes(
    attributes: OCAttributes,
    resourceLabels: Record<string, AttributeValue>): Attributes {
  const attributesBuilder = generateAttributesBuilder(attributes, 0);
  attributesBuilder.attributeMap[AGENT_LABEL_KEY] = AGENT_LABEL_VALUE;
  attributesBuilder.attributeMap =
      Object.assign({}, attributesBuilder.attributeMap, resourceLabels);
  return attributesBuilder;
}

/**
 * Generates StackDriver TimeEvents from OpenCensus Annotation and MessageEvent.
 * @param annotationTimedEvents OCAnnotation[]
 * @param messageEventTimedEvents OCMessageEvent[]
 * @returns TimeEvents
 */
export function generateTimeEvents(
    annotationTimedEvents: OCAnnotation[],
    messageEventTimedEvents: OCMessageEvent[]): TimeEvents {
  const timeEvents: TimeEvent[] = [];
  if (annotationTimedEvents) {
    annotationTimedEvents.forEach(annotation => {
      timeEvents.push({
        time: new Date(annotation.timestamp).toISOString(),
        annotation: {
          description: stringToTruncatableString(annotation.description),
          attributes: generateAttributesBuilder(annotation.attributes, 0)
        }
      });
    });
  }
  if (messageEventTimedEvents) {
    messageEventTimedEvents.forEach(messageEvent => {
      timeEvents.push({
        time: new Date(messageEvent.timestamp).toISOString(),
        messageEvent: {
          id: messageEvent.id,
          type: generateMessageEventType(messageEvent.type)
        }
      });
    });
  }
  return {
    timeEvent: timeEvents,
    // TODO(mayurkale): issues/316->enforce param limits and get dropped counts.
    droppedAnnotationsCount: 0,
    droppedMessageEventsCount: 0
  };
}

export function stringToTruncatableString(value: string): TruncatableString {
  return {value, truncatedByteCount: 0};
}

function createResourceLabelKey(
    resourceType: string, resourceAttribute: string): string {
  return `g.co/r/${resourceType}/${resourceAttribute}`;
}

export async function getResourceLabels(
    monitoredResource: Promise<MonitoredResource>) {
  const resource = await monitoredResource;
  const resourceLabels: Record<string, AttributeValue> = {};
  if (resource.type !== 'global') {
    const labels = resource.labels;
    Object.keys(labels).forEach((label) => {
      const resourceLabel = createResourceLabelKey(resource.type, label);
      const value = labels[label];
      resourceLabels[resourceLabel] = generateAttributeValue(value);
    });
  }
  return resourceLabels;
}

function generateAttributesBuilder(
    attributes: OCAttributes, droppedAttributesCount: number): Attributes {
  const attributeMap: Record<string, AttributeValue> = {};
  if (attributes) {
    Object.keys(attributes).forEach((attribute) => {
      const value = attributes[attribute];
      attributeMap[attribute] = generateAttributeValue(value);
    });
  }
  return {attributeMap, droppedAttributesCount};
}

function generateLink(link: OCLink): Link {
  const traceId = hexToDec(link.traceId);
  const spanId = hexToDec(link.spanId);
  const type = link.type;
  const attributes = generateAttributesBuilder(link.attributes, 0);
  return {traceId, spanId, type, attributes};
}

function generateAttributeValue(value: string|number|boolean): AttributeValue {
  switch (typeof value) {
    case 'number':
      return {intValue: String(value)};
    case 'boolean':
      return {boolValue: value as boolean};
    case 'string':
      return {stringValue: stringToTruncatableString(value)};
    default:
      throw new Error(`Unsupported type : ${typeof value}`);
  }
}

function generateMessageEventType(value: string) {
  switch (value) {
    case 'MessageEventTypeSent': {
      return Type.SENT;
    }
    case 'MessageEventTypeRecv': {
      return Type.RECEIVED;
    }
    default: { return Type.TYPE_UNSPECIFIED; }
  }
}
