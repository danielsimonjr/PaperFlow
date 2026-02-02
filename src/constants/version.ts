/**
 * Version Constants
 *
 * Centralized version information for the application.
 */

/**
 * Application version
 */
export const APP_VERSION = '3.0.0-alpha.1';

/**
 * Application name
 */
export const APP_NAME = 'PaperFlow';

/**
 * Application description
 */
export const APP_DESCRIPTION = 'Modern PDF Editor for Desktop and Web';

/**
 * Release type
 */
export type ReleaseChannel = 'stable' | 'beta' | 'alpha';

/**
 * Current release channel
 */
export const RELEASE_CHANNEL: ReleaseChannel = 'alpha';

/**
 * Build date (ISO string)
 */
export const BUILD_DATE = new Date().toISOString();

/**
 * Copyright notice
 */
export const COPYRIGHT = `Copyright ${new Date().getFullYear()} PaperFlow. All rights reserved.`;

/**
 * Version info object
 */
export const VERSION_INFO = {
  version: APP_VERSION,
  name: APP_NAME,
  description: APP_DESCRIPTION,
  channel: RELEASE_CHANNEL,
  buildDate: BUILD_DATE,
  copyright: COPYRIGHT,
} as const;

/**
 * Parse version string into components
 */
export function parseVersion(version: string): {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  prereleaseNum?: number;
} {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([a-z]+)\.?(\d+)?)?$/i);

  if (!match || !match[1] || !match[2] || !match[3]) {
    throw new Error(`Invalid version string: ${version}`);
  }

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4],
    prereleaseNum: match[5] ? parseInt(match[5], 10) : undefined,
  };
}

/**
 * Compare two version strings
 * @returns -1 if a < b, 0 if a == b, 1 if a > b
 */
export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  const vA = parseVersion(a);
  const vB = parseVersion(b);

  // Compare major.minor.patch
  if (vA.major !== vB.major) return vA.major < vB.major ? -1 : 1;
  if (vA.minor !== vB.minor) return vA.minor < vB.minor ? -1 : 1;
  if (vA.patch !== vB.patch) return vA.patch < vB.patch ? -1 : 1;

  // Prerelease versions are less than release versions
  if (vA.prerelease && !vB.prerelease) return -1;
  if (!vA.prerelease && vB.prerelease) return 1;

  // Compare prerelease
  if (vA.prerelease && vB.prerelease) {
    const order = ['alpha', 'beta', 'rc'];
    const indexA = order.indexOf(vA.prerelease.toLowerCase());
    const indexB = order.indexOf(vB.prerelease.toLowerCase());

    if (indexA !== indexB) {
      return indexA < indexB ? -1 : 1;
    }

    // Compare prerelease number
    const numA = vA.prereleaseNum ?? 0;
    const numB = vB.prereleaseNum ?? 0;
    if (numA !== numB) return numA < numB ? -1 : 1;
  }

  return 0;
}

/**
 * Check if a version is a prerelease
 */
export function isPrerelease(version: string): boolean {
  return /-(alpha|beta|rc)/i.test(version);
}

/**
 * Get display-friendly version string
 */
export function getDisplayVersion(): string {
  if (RELEASE_CHANNEL === 'stable') {
    return APP_VERSION;
  }
  return `${APP_VERSION} (${RELEASE_CHANNEL.charAt(0).toUpperCase() + RELEASE_CHANNEL.slice(1)})`;
}
