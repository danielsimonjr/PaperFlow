/**
 * Path sandbox tests (security findings 2026-05-01 #5 + #6).
 *
 * Covered:
 *   - paths must be approved (via dialog) before any FILE / FOLDER op
 *   - traversal segments (..) are refused both as input and post-resolve
 *   - extension allow-list (default .pdf/.json/.txt/.bak/.tmp) is enforced
 *     for write/save/copy/move dest, but not for read-side ops
 *   - approving a directory implicitly approves its descendants
 */

import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import {
  approvePath,
  approvePaths,
  isPathAllowed,
  isExtensionAllowedForWrite,
  assertPathAllowed,
  assertExtensionAllowedForWrite,
  _resetSandbox,
  _approvedRootsSnapshot,
  DEFAULT_WRITE_EXTENSIONS,
} from '../../electron/ipc/pathSandbox';

const FILE = path.resolve('/tmp/papers/doc.pdf');
const DIR = path.resolve('/tmp/papers');

describe('pathSandbox.isPathAllowed', () => {
  beforeEach(() => {
    _resetSandbox();
  });

  it('refuses any path before anything is approved', () => {
    expect(isPathAllowed(FILE)).toBe(false);
  });

  it('allows an exactly-approved path', () => {
    approvePath(FILE);
    expect(isPathAllowed(FILE)).toBe(true);
  });

  it('allows descendants of an approved directory', () => {
    approvePath(DIR);
    expect(isPathAllowed(path.join(DIR, 'sub', 'file.pdf'))).toBe(true);
  });

  it('refuses siblings of an approved file (no implicit folder approval)', () => {
    approvePath(FILE);
    expect(isPathAllowed(path.resolve('/tmp/papers/other.pdf'))).toBe(false);
  });

  it('refuses paths that contain `..` segments in the input', () => {
    approvePath(DIR);
    expect(isPathAllowed(`${DIR}/sub/../../etc/passwd`)).toBe(false);
  });

  it('refuses absolute paths to unapproved roots', () => {
    approvePath(DIR);
    expect(isPathAllowed(path.resolve('/etc/passwd'))).toBe(false);
  });

  it('approvePaths approves a list at once', () => {
    approvePaths([DIR, FILE]);
    expect(_approvedRootsSnapshot().length).toBe(2);
  });

  it('refuses empty / non-string paths', () => {
    expect(isPathAllowed('')).toBe(false);
    // @ts-expect-error - test runtime defence
    expect(isPathAllowed(undefined)).toBe(false);
  });
});

describe('pathSandbox.isExtensionAllowedForWrite', () => {
  it('allows .pdf, .json, .txt by default', () => {
    expect(isExtensionAllowedForWrite('a.pdf')).toBe(true);
    expect(isExtensionAllowedForWrite('a.json')).toBe(true);
    expect(isExtensionAllowedForWrite('a.txt')).toBe(true);
  });

  it('allows the system .bak / .tmp extensions for backup/auto-save', () => {
    expect(isExtensionAllowedForWrite('a.bak')).toBe(true);
    expect(isExtensionAllowedForWrite('a.tmp')).toBe(true);
  });

  it('refuses dangerous executable extensions', () => {
    expect(isExtensionAllowedForWrite('a.exe')).toBe(false);
    expect(isExtensionAllowedForWrite('a.bat')).toBe(false);
    expect(isExtensionAllowedForWrite('a.sh')).toBe(false);
    expect(isExtensionAllowedForWrite('a.dll')).toBe(false);
    expect(isExtensionAllowedForWrite('a.ps1')).toBe(false);
  });

  it('refuses files without an extension', () => {
    expect(isExtensionAllowedForWrite('justaname')).toBe(false);
  });

  it('honors a caller-supplied allow-list', () => {
    const onlyPdf = new Set(['.pdf']);
    expect(isExtensionAllowedForWrite('a.pdf', onlyPdf)).toBe(true);
    expect(isExtensionAllowedForWrite('a.json', onlyPdf)).toBe(false);
  });

  it('exports the default set for inspection', () => {
    expect(DEFAULT_WRITE_EXTENSIONS.has('.pdf')).toBe(true);
  });
});

describe('pathSandbox assert helpers', () => {
  beforeEach(() => {
    _resetSandbox();
  });

  it('assertPathAllowed throws on unapproved path', () => {
    expect(() => assertPathAllowed(FILE)).toThrow(/not approved/i);
  });

  it('assertPathAllowed passes for approved path', () => {
    approvePath(FILE);
    expect(() => assertPathAllowed(FILE)).not.toThrow();
  });

  it('assertExtensionAllowedForWrite throws on disallowed extension', () => {
    expect(() => assertExtensionAllowedForWrite('a.exe')).toThrow(/not allowed/i);
  });

  it('assertExtensionAllowedForWrite passes on .pdf', () => {
    expect(() => assertExtensionAllowedForWrite('a.pdf')).not.toThrow();
  });
});
