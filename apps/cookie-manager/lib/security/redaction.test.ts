import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Recursively collect shipped source files (exclude tests, e2e, build/output/dep dirs).
function sources(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.output' || entry === '.wxt' || entry === 'e2e' || entry === 'dist') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sources(full, acc);
    else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) acc.push(full);
  }
  return acc;
}

// Remove string-literal contents so words that appear only inside a log MESSAGE (e.g.
// console.error('profile load failed', err)) don't trip the guard — only real identifier
// references (e.g. console.log(cookie)) do.
function stripStrings(line: string): string {
  return line
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/`(?:\\.|[^`\\])*`/g, '``');
}

const CONSOLE = /console\.(log|error|warn|info|debug|dir|table|trace)\(/i;
// Risky identifiers: cookie values/objects, drafts, profiles, passphrases, plaintext, blobs, secrets.
// Matched against the string-stripped line, so it catches whole-object logging (console.log(cookie))
// and aliases spelled with these names, not just `.value` access.
const RISKY_ID = /\b(values?|passphrase|pass|plaintext|blob|cookies?|draft|profile|secret)\b/i;

describe('redaction audit', () => {
  it('no shipped source logs a cookie value/object, passphrase, or plaintext blob', () => {
    const roots = [
      join(__dirname, '..', '..'), // apps/cookie-manager
      join(__dirname, '..', '..', '..', '..', 'packages', 'ui-kit'), // shared package
    ];
    const offenders: string[] = [];
    for (const root of roots) {
      for (const file of sources(root)) {
        readFileSync(file, 'utf8')
          .split('\n')
          .forEach((line, i) => {
            const code = stripStrings(line);
            if (CONSOLE.test(code) && RISKY_ID.test(code)) offenders.push(`${file}:${i + 1}  ${line.trim()}`);
          });
      }
    }
    // Known blind spot: a console call split across multiple lines is scanned line-by-line and
    // may evade this heuristic. This guard is a regression tripwire, not a proof.
    expect(offenders).toEqual([]);
  });
});
