import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Recursively collect shipped source files (exclude tests, .output, node_modules, .wxt).
function sources(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.output' || entry === '.wxt' || entry === 'e2e') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sources(full, acc);
    else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) acc.push(full);
  }
  return acc;
}

// A console.* call is risky if the same statement references a cookie value or a passphrase.
const RISKY = /console\.(log|error|warn|info|debug)\([^)]*\b(value|passphrase|\bpass\b|plaintext|\bblob\b)\b/;

describe('redaction audit', () => {
  it('no shipped source logs a cookie value, passphrase, or plaintext blob', () => {
    const offenders: string[] = [];
    for (const file of sources(join(__dirname, '..', '..'))) {
      const text = readFileSync(file, 'utf8');
      text.split('\n').forEach((line, i) => {
        if (RISKY.test(line)) offenders.push(`${file}:${i + 1}  ${line.trim()}`);
      });
    }
    expect(offenders).toEqual([]);
  });
});
