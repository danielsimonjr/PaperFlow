import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const entry = resolve(__dirname, '../../../src/index.css');
const source = readFileSync(entry, 'utf8');

/** The entry stylesheet with comments removed. */
const css = source.replace(/\/\*[\s\S]*?\*\//g, '');

/**
 * CSS ignores an `@import` that follows any other statement, and a bundler
 * drops it with a warning. The five stylesheets named after `@tailwind` in the
 * entry never reached a build because of this.
 */
function splitLeadingImports(text: string): { imports: string[]; rest: string } {
  const imports: string[] = [];
  let rest = text.trimStart();
  for (;;) {
    const match = /^@(?:import|charset)\b[^;]*;\s*/.exec(rest);
    if (!match) break;
    imports.push(match[0].trim());
    rest = rest.slice(match[0].length);
  }
  return { imports, rest };
}

describe('src/index.css stylesheet imports', () => {
  const { imports, rest } = splitLeadingImports(css);

  it('has no @import after the first statement that is not an @import', () => {
    const late = rest.match(/@import\b[^;]*;/g) ?? [];
    expect(late).toEqual([]);
  });

  it('names a file that exists for every @import', () => {
    const paths = imports
      .map((statement) => /@import\s+(?:url\()?['"]([^'"]+)['"]/.exec(statement)?.[1])
      .filter((path): path is string => typeof path === 'string');
    expect(paths.length).toBe(imports.length);
    for (const path of paths) {
      expect(existsSync(resolve(dirname(entry), path)), path).toBe(true);
    }
  });

  it('loads the Tailwind layers before the project stylesheets', () => {
    const names = imports.map((statement) => /['"]([^'"]+)['"]/.exec(statement)?.[1] ?? '');
    const tailwind = names.findIndex((name) => name.endsWith('tailwind.css'));
    expect(tailwind).toBe(0);
    expect(names.slice(1)).toEqual([
      './styles/focus.css',
      './styles/mobile.css',
      './styles/high-contrast.css',
      './styles/platform.css',
    ]);
  });

  it('keeps the three Tailwind directives together in the Tailwind entry', () => {
    const tailwindFile = resolve(dirname(entry), 'styles/tailwind.css');
    expect(existsSync(tailwindFile)).toBe(true);
    const text = readFileSync(tailwindFile, 'utf8');
    expect(text).toMatch(/@tailwind\s+base;/);
    expect(text).toMatch(/@tailwind\s+components;/);
    expect(text).toMatch(/@tailwind\s+utilities;/);
    expect(css).not.toMatch(/@tailwind\b/);
  });
});
