/*
 * Shamelessly taken from the lit-html sources.
 * Will be removed when lit-html 0.8 arrives 💩.
 */

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

import { directive, DirectiveFn, NodePart } from 'lit-html';

export type KeyFn<T> = (item: T) => any;
export type ItemTemplate<T> = (item: T, index: number) => any;

const keyMapCache = new WeakMap<NodePart, Map<any, NodePart>>();

function cleanMap(part: NodePart, key: any, map: Map<any, NodePart>) {
  if (!part.startNode.parentNode) {
    map.delete(key);
  }
}

export const reparentNodes =
    (container: Node,
     start: Node | null,
     end: Node | null = null,
     before: Node | null = null): void => {
      let node = start;
      while (node !== end) {
        const n = node!.nextSibling;
        container.insertBefore(node!, before as Node);
        node = n;
      }
    };

/**
 * Removes nodes, starting from `startNode` (inclusive) to `endNode`
 * (exclusive), from `container`.
 */
export const removeNodes =
    (container: Node, startNode: Node | null, endNode: Node | null = null):
        void => {
          let node = startNode;
          while (node !== endNode) {
            const n = node!.nextSibling;
            container.removeChild(node!);
            node = n;
          }
        };

export function repeat<T>(
    items: T[], keyFn: KeyFn<T>, template: ItemTemplate<T>): DirectiveFn;
export function repeat<T>(items: T[], template: ItemTemplate<T>): DirectiveFn;
export function repeat<T>(
    items: Iterable<T>,
    keyFnOrTemplate: KeyFn<T> | ItemTemplate<T>,
    template?: ItemTemplate<T>): DirectiveFn {
  let keyFn: KeyFn<T>;
  if (arguments.length === 2) {
    template = keyFnOrTemplate;
  } else if (arguments.length === 3) {
    keyFn = keyFnOrTemplate as KeyFn<T>;
  }

  return directive((part: NodePart): any => {

    let keyMap = keyMapCache.get(part);
    if (keyMap === undefined) {
      keyMap = new Map();
      keyMapCache.set(part, keyMap);
    }
    const container = part.startNode.parentNode as HTMLElement | ShadowRoot |
        DocumentFragment;
    let index = -1;
    let currentMarker = part.startNode.nextSibling!;

    for (const item of items) {
      let result;
      let key;
      try {
        ++index;
        result = template !(item, index);
        key = keyFn ? keyFn(item) : index;
      } catch (e) {
        console.error(e);
        continue;
      }

      // Try to reuse a part
      let itemPart = keyMap.get(key);
      if (itemPart === undefined) {
        const marker = document.createTextNode('');
        const endNode = document.createTextNode('');
        container.insertBefore(marker, currentMarker);
        container.insertBefore(endNode, currentMarker);
        itemPart = new NodePart(part.instance, marker, endNode);
        if (key !== undefined) {
          keyMap.set(key, itemPart);
        }
      } else if (currentMarker !== itemPart.startNode) {
        // Existing part in the wrong position
        const end = itemPart.endNode.nextSibling!;
        if (currentMarker !== end) {
          reparentNodes(
              container,
              itemPart.startNode,
              end,
              currentMarker);
        }
      } else {
        // else part is in the correct position already
        currentMarker = itemPart.endNode.nextSibling!;
      }

      itemPart.setValue(result);
    }

    // Cleanup
    if (currentMarker !== part.endNode) {
      removeNodes(container, currentMarker, part.endNode);
      keyMap.forEach(cleanMap);
    }
  });
}
