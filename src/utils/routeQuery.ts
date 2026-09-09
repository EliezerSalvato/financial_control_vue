import type { LocationQuery, LocationQueryRaw } from 'vue-router';
import { keysToCamelCase, keysToSnakeCase } from '@/utils/case';

/** App (camelCase) → URL query (snake_case). */
export function appQueryToRoute(query: Record<string, unknown>): LocationQueryRaw {
  return keysToSnakeCase<LocationQueryRaw>(query);
}

/** URL query (snake_case) → app (camelCase). */
export function routeQueryToApp<T>(query: LocationQuery): T {
  return keysToCamelCase<T>(query);
}
