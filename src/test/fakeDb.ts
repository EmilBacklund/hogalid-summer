import { vi } from 'vitest';
import type { Client, Row } from '@libsql/client';

/**
 * Minimal libsql `Client` stand-in for handler tests. Rules match on the SQL
 * string and return canned result sets; every call is recorded on `.calls` so
 * tests can assert what was written (e.g. server-recomputed points).
 */

export interface Canned {
  rows?: Row[];
  rowsAffected?: number;
  lastInsertRowid?: bigint;
}

export interface Rule {
  test: (sql: string) => boolean;
  result: Canned | ((sql: string, args: unknown[]) => Canned);
}

export interface FakeDb {
  client: Client;
  calls: { sql: string; args: unknown[] }[];
}

export function createFakeDb(rules: Rule[] = []): FakeDb {
  const calls: { sql: string; args: unknown[] }[] = [];

  function resolve(sql: string, args: unknown[]): Canned {
    for (const rule of rules) {
      if (rule.test(sql)) {
        return typeof rule.result === 'function' ? rule.result(sql, args) : rule.result;
      }
    }
    return { rows: [] };
  }

  const execute = vi.fn(async (q: string | { sql: string; args?: unknown[] }) => {
    const sql = typeof q === 'string' ? q : q.sql;
    const args = typeof q === 'string' ? [] : (q.args ?? []);
    calls.push({ sql, args });
    const c = resolve(sql, args);
    return {
      rows: c.rows ?? [],
      rowsAffected: c.rowsAffected ?? 0,
      lastInsertRowid: c.lastInsertRowid ?? 0n,
      columns: [],
      columnTypes: [],
      toJSON: () => ({}),
    };
  });

  const client = {
    execute,
    executeMultiple: vi.fn(async () => {}),
    batch: vi.fn(async () => []),
    close: vi.fn(),
  } as unknown as Client;

  return { client, calls };
}

/** Build a `cookie` header string carrying a signed session value. */
export function cookieHeader(name: string, value: string): string {
  return `${name}=${encodeURIComponent(value)}`;
}
