/**
 * Path sandbox for IPC file handlers (security finding 2026-05-01 #5).
 *
 * Renderer-supplied paths must not be trusted blindly. This module keeps
 * a process-local allow-list of paths the user explicitly authorised
 * (via the native open/save/folder dialogs) and exposes helpers to test
 * any subsequent FILE / FOLDER IPC path against it.
 *
 * Rules:
 *   - A path is allowed if it equals an approved root, OR
 *   - it is a descendant of an approved root (after path.resolve), AND
 *   - the resolved form has no `..` traversal segments (canonical path).
 *
 * For write/save/delete/move/copy/folder-create ops we additionally
 * require the file extension to be on a small allow-list. Read-side ops
 * (read, list, stats, exists) are extension-agnostic since the user
 * already pointed at the file via a dialog.
 */

import path from 'path';

const approvedRoots = new Set<string>();

/** Default extension allow-list for write-side operations. */
export const DEFAULT_WRITE_EXTENSIONS = new Set<string>([
  '.pdf',
  '.json',
  '.txt',
  // Common siblings observed in renderer call sites:
  // - signed/exported PDFs may carry .pdf
  // - settings/recent-files persisted as .json
  // - logs/notes as .txt
]);

/** Extra extensions used by recovery/backup/auto-save plumbing. */
const SYSTEM_WRITE_EXTENSIONS = new Set<string>([
  '.bak', // backups
  '.tmp', // auto-save scratch
]);

/** Reset state (test helper). */
export function _resetSandbox(): void {
  approvedRoots.clear();
}

/** Snapshot the approved roots (test helper). */
export function _approvedRootsSnapshot(): string[] {
  return Array.from(approvedRoots);
}

/**
 * Approve a path returned from a native dialog. The path is resolved to
 * a canonical absolute form before being stored.
 */
export function approvePath(p: string | undefined | null): void {
  if (!p) return;
  approvedRoots.add(path.resolve(p));
}

/** Approve every path in an array (e.g. dialog.showOpenDialog filePaths). */
export function approvePaths(paths: readonly string[] | undefined): void {
  if (!paths) return;
  for (const p of paths) approvePath(p);
}

/**
 * Returns true if `candidate` is the same as `root` or sits underneath it.
 * Uses path.relative to detect traversal escapes.
 */
function isWithinRoot(candidate: string, root: string): boolean {
  if (candidate === root) return true;
  const rel = path.relative(root, candidate);
  if (rel === '' || rel === '.') return true;
  // ../something or absolute path means it's outside.
  if (rel.startsWith('..')) return false;
  if (path.isAbsolute(rel)) return false;
  return true;
}

/**
 * Returns true iff the path is approved (or descends from an approved root)
 * AND its canonical form does not contain a `..` traversal segment.
 */
export function isPathAllowed(rendererPath: string): boolean {
  if (typeof rendererPath !== 'string' || rendererPath.length === 0) {
    return false;
  }

  // Reject any literal `..` segment in the *input*. After path.resolve a
  // traversal would be flattened, so the check has to happen pre-resolve.
  // Use both forward and backward slashes for cross-platform safety.
  const segments = rendererPath.split(/[\\/]/);
  if (segments.includes('..')) return false;

  let resolved: string;
  try {
    resolved = path.resolve(rendererPath);
  } catch {
    return false;
  }

  // Resolved path must also not contain `..` (paranoid - resolve should
  // have flattened any, but this catches odd edge cases on Windows).
  if (resolved.split(/[\\/]/).includes('..')) return false;

  for (const root of approvedRoots) {
    if (isWithinRoot(resolved, root)) return true;
  }
  return false;
}

/**
 * Returns true iff the extension of `p` is in the write allow-list.
 * Uses the user-supplied list when provided, else `DEFAULT_WRITE_EXTENSIONS`
 * + `SYSTEM_WRITE_EXTENSIONS`.
 */
export function isExtensionAllowedForWrite(
  p: string,
  allowed?: ReadonlySet<string>,
): boolean {
  const ext = path.extname(p).toLowerCase();
  if (!ext) return false;
  if (allowed) return allowed.has(ext);
  return DEFAULT_WRITE_EXTENSIONS.has(ext) || SYSTEM_WRITE_EXTENSIONS.has(ext);
}

/**
 * Throws if the path is not allowed. Caller catches and converts to a
 * structured error result for the renderer. Centralising the throw keeps
 * every handler's failure shape consistent.
 */
export function assertPathAllowed(p: string): void {
  if (!isPathAllowed(p)) {
    throw new Error(`Path not approved by sandbox: ${p}`);
  }
}

/** Throws if the extension is not approved for writes. */
export function assertExtensionAllowedForWrite(
  p: string,
  allowed?: ReadonlySet<string>,
): void {
  if (!isExtensionAllowedForWrite(p, allowed)) {
    throw new Error(`Extension not allowed for write: ${path.extname(p) || '(none)'}`);
  }
}
