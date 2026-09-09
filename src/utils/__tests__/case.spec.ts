import { describe, expect, it } from 'vitest';
import { keysToCamelCase, keysToSnakeCase, toCamelKey, toSnakeKey } from '@/utils/case';

describe('toCamelKey / toSnakeKey', () => {
  it('converte chaves simples', () => {
    expect(toCamelKey('first_name')).toBe('firstName');
    expect(toCamelKey('resource_id')).toBe('resourceId');
    expect(toSnakeKey('firstName')).toBe('first_name');
    expect(toSnakeKey('resourceId')).toBe('resource_id');
  });

  it('mantém chaves que já estão no formato alvo', () => {
    expect(toCamelKey('name')).toBe('name');
    expect(toSnakeKey('name')).toBe('name');
  });
});

describe('keysToCamelCase', () => {
  it('converte objetos aninhados e arrays', () => {
    expect(
      keysToCamelCase({
        first_name: 'Ada',
        nested: { last_name: 'Lovelace' },
        items: [{ created_at: '2026-01-01' }],
      }),
    ).toEqual({
      firstName: 'Ada',
      nested: { lastName: 'Lovelace' },
      items: [{ createdAt: '2026-01-01' }],
    });
  });

  it('preserva primitivos, null e datas', () => {
    expect(keysToCamelCase(null)).toBeNull();
    expect(keysToCamelCase(12)).toBe(12);
    expect(keysToCamelCase('ok')).toBe('ok');

    const date = new Date('2026-01-01T00:00:00.000Z');

    expect(keysToCamelCase(date)).toBe(date);
  });
});

describe('keysToSnakeCase', () => {
  it('converte objetos aninhados e arrays', () => {
    expect(
      keysToSnakeCase({
        firstName: 'Ada',
        nested: { lastName: 'Lovelace' },
        items: [{ createdAt: '2026-01-01' }],
      }),
    ).toEqual({
      first_name: 'Ada',
      nested: { last_name: 'Lovelace' },
      items: [{ created_at: '2026-01-01' }],
    });
  });
});
