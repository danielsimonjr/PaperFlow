/**
 * Configuration Precedence (Sprint 20)
 *
 * Defines and enforces configuration precedence rules.
 */

import type { ConfigSourceType } from './configMerger';

/**
 * Precedence level definition
 */
export interface PrecedenceLevel {
  type: ConfigSourceType;
  priority: number;
  description: string;
  canOverride: ConfigSourceType[];
  canBeOverriddenBy: ConfigSourceType[];
  isMandatory: boolean;
}

/**
 * Precedence configuration
 */
export const PRECEDENCE_LEVELS: PrecedenceLevel[] = [
  {
    type: 'default',
    priority: 0,
    description: 'Built-in default values',
    canOverride: [],
    canBeOverriddenBy: ['system', 'user', 'file', 'remote', 'env', 'cli', 'gpo', 'mdm'],
    isMandatory: false,
  },
  {
    type: 'system',
    priority: 10,
    description: 'System-wide configuration (/etc/paperflow, ProgramData)',
    canOverride: ['default'],
    canBeOverriddenBy: ['user', 'file', 'remote', 'env', 'cli', 'gpo', 'mdm'],
    isMandatory: false,
  },
  {
    type: 'user',
    priority: 20,
    description: 'User-specific configuration (~/.config/paperflow)',
    canOverride: ['default', 'system'],
    canBeOverriddenBy: ['file', 'remote', 'env', 'cli', 'gpo', 'mdm'],
    isMandatory: false,
  },
  {
    type: 'file',
    priority: 30,
    description: 'Project-specific configuration (./paperflow.config.json)',
    canOverride: ['default', 'system', 'user'],
    canBeOverriddenBy: ['remote', 'env', 'cli', 'gpo', 'mdm'],
    isMandatory: false,
  },
  {
    type: 'remote',
    priority: 40,
    description: 'Remote configuration server',
    canOverride: ['default', 'system', 'user', 'file'],
    canBeOverriddenBy: ['env', 'cli', 'gpo', 'mdm'],
    isMandatory: false,
  },
  {
    type: 'env',
    priority: 50,
    description: 'Environment variables',
    canOverride: ['default', 'system', 'user', 'file', 'remote'],
    canBeOverriddenBy: ['cli', 'gpo', 'mdm'],
    isMandatory: false,
  },
  {
    type: 'cli',
    priority: 60,
    description: 'Command-line arguments',
    canOverride: ['default', 'system', 'user', 'file', 'remote', 'env'],
    canBeOverriddenBy: ['gpo', 'mdm'],
    isMandatory: false,
  },
  {
    type: 'gpo',
    priority: 70,
    description: 'Windows Group Policy (mandatory)',
    canOverride: ['default', 'system', 'user', 'file', 'remote', 'env', 'cli'],
    canBeOverriddenBy: [],
    isMandatory: true,
  },
  {
    type: 'mdm',
    priority: 70,
    description: 'macOS MDM managed preferences (mandatory)',
    canOverride: ['default', 'system', 'user', 'file', 'remote', 'env', 'cli'],
    canBeOverriddenBy: [],
    isMandatory: true,
  },
];

/**
 * Get precedence level for a source type
 */
export function getPrecedenceLevel(type: ConfigSourceType): PrecedenceLevel | undefined {
  return PRECEDENCE_LEVELS.find((level) => level.type === type);
}

/**
 * Get priority value for a source type
 */
export function getPriority(type: ConfigSourceType): number {
  const level = getPrecedenceLevel(type);
  return level?.priority ?? 0;
}

/**
 * Check if source A can override source B
 */
export function canOverride(sourceA: ConfigSourceType, sourceB: ConfigSourceType): boolean {
  const levelA = getPrecedenceLevel(sourceA);
  const levelB = getPrecedenceLevel(sourceB);

  if (!levelA || !levelB) {
    return false;
  }

  return levelA.canOverride.includes(sourceB);
}

/**
 * Check if a setting from a source is mandatory (cannot be changed by user)
 */
export function isMandatory(source: ConfigSourceType): boolean {
  const level = getPrecedenceLevel(source);
  return level?.isMandatory ?? false;
}

/**
 * Sort sources by precedence
 */
export function sortByPrecedence(sources: ConfigSourceType[]): ConfigSourceType[] {
  return [...sources].sort((a, b) => getPriority(a) - getPriority(b));
}

/**
 * Get the highest priority source from a list
 */
export function getHighestPriority(sources: ConfigSourceType[]): ConfigSourceType | undefined {
  if (sources.length === 0) return undefined;
  return sortByPrecedence(sources).pop();
}

/**
 * Check if a setting can be modified by the user
 */
export function isUserModifiable(settingPath: string, sources: Map<string, ConfigSourceType>): boolean {
  const source = sources.get(settingPath);

  if (!source) {
    return true; // Not set by any source, can be modified
  }

  const level = getPrecedenceLevel(source);
  if (!level) {
    return true;
  }

  // Mandatory sources cannot be overridden by user
  return !level.isMandatory;
}

/**
 * Get explanation for why a setting cannot be modified
 */
export function getLockedReason(
  settingPath: string,
  sources: Map<string, ConfigSourceType>
): string | null {
  const source = sources.get(settingPath);

  if (!source) {
    return null;
  }

  const level = getPrecedenceLevel(source);
  if (!level || !level.isMandatory) {
    return null;
  }

  return `This setting is managed by ${level.description} and cannot be changed.`;
}

/**
 * Get all sources that could override a given source
 */
export function getOverridingSources(source: ConfigSourceType): ConfigSourceType[] {
  const level = getPrecedenceLevel(source);
  return level?.canBeOverriddenBy ?? [];
}

/**
 * Get all sources that a given source can override
 */
export function getOverridableSources(source: ConfigSourceType): ConfigSourceType[] {
  const level = getPrecedenceLevel(source);
  return level?.canOverride ?? [];
}

/**
 * Precedence documentation
 */
export const PRECEDENCE_DOCUMENTATION = `
# Configuration Precedence

PaperFlow loads configuration from multiple sources. When the same setting
is defined in multiple sources, the value from the higher-priority source
is used.

## Precedence Order (lowest to highest)

1. **Default** (priority: 0)
   Built-in default values compiled into the application.

2. **System** (priority: 10)
   System-wide configuration files:
   - Windows: C:\\ProgramData\\PaperFlow\\config.json
   - macOS: /Library/Application Support/PaperFlow/config.json
   - Linux: /etc/paperflow/config.yaml

3. **User** (priority: 20)
   User-specific configuration files:
   - Windows: %APPDATA%\\PaperFlow\\config.json
   - macOS: ~/Library/Application Support/PaperFlow/config.json
   - Linux: ~/.config/paperflow/config.yaml

4. **File** (priority: 30)
   Project-specific configuration in the current directory:
   - paperflow.config.json
   - paperflow.config.yaml
   - .paperflowrc

5. **Remote** (priority: 40)
   Configuration fetched from a remote server endpoint.

6. **Environment** (priority: 50)
   Environment variables with PAPERFLOW_ prefix.

7. **CLI** (priority: 60)
   Command-line arguments passed to the application.

8. **GPO/MDM** (priority: 70)
   Enterprise-managed settings via Group Policy (Windows) or MDM (macOS).
   These are **mandatory** and cannot be overridden by the user.

## Mandatory Settings

Settings from GPO or MDM sources are considered mandatory. The user interface
will show these settings as locked and they cannot be changed by the user.
This ensures enterprise policy compliance.
`;

export default PRECEDENCE_LEVELS;
