type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

function toCamelKey(key: string): string {
  return key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function toSnakeKey(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function isPlainObject(value: unknown): value is JsonObject {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function transformKeys(value: unknown, transformKey: (key: string) => string): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => transformKeys(item, transformKey));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.fromEntries(Object.entries(value).map(([key, nested]) => [transformKey(key), transformKeys(nested, transformKey)]));
}

export function keysToCamelCase<T>(value: unknown): T {
  return transformKeys(value, toCamelKey) as T;
}

export function keysToSnakeCase<T>(value: unknown): T {
  return transformKeys(value, toSnakeKey) as T;
}

export { toCamelKey, toSnakeKey };
