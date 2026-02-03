/**
 * Configuration Viewer Component (Sprint 20)
 *
 * Displays current configuration with source attribution.
 */

import React, { useState, useMemo } from 'react';
import { useEnterprisePolicyStore } from '@/stores/enterprisePolicyStore';
import { ConfigSourceBadge } from './ConfigSourceBadge';
import { LockedSettingBadge } from './LockedSettingBadge';

/**
 * Configuration viewer props
 */
interface ConfigurationViewerProps {
  /** Show all settings or only modified */
  showAll?: boolean;
  /** Filter by category */
  category?: string;
  /** Search filter */
  searchFilter?: string;
  /** Expand all sections */
  expandAll?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Configuration section
 */
interface ConfigSection {
  name: string;
  path: string;
  settings: ConfigSetting[];
}

/**
 * Configuration setting
 */
interface ConfigSetting {
  key: string;
  path: string;
  value: unknown;
  source?: string;
  isLocked: boolean;
  isModified: boolean;
}

/**
 * Format a value for display
 */
function formatValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === 'object') return '{...}';
  return String(value);
}

/**
 * Configuration Viewer Component
 */
export function ConfigurationViewer({
  showAll = true,
  category,
  searchFilter,
  expandAll = false,
  className = '',
}: ConfigurationViewerProps): React.ReactElement {
  const mergedConfig = useEnterprisePolicyStore((state) => state.mergedConfig);
  const configSources = useEnterprisePolicyStore((state) => state.configSources);
  const lockedSettings = useEnterprisePolicyStore((state) => state.lockedSettings);
  const lastUpdated = useEnterprisePolicyStore((state) => state.lastUpdated);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [selectedSetting, setSelectedSetting] = useState<string | null>(null);

  /**
   * Build configuration sections
   */
  const sections = useMemo((): ConfigSection[] => {
    if (!mergedConfig) return [];

    const result: ConfigSection[] = [];

    const processObject = (
      obj: Record<string, unknown>,
      basePath: string,
      sectionName: string
    ): ConfigSection => {
      const settings: ConfigSetting[] = [];

      for (const [key, value] of Object.entries(obj)) {
        const path = basePath ? `${basePath}.${key}` : key;

        // Skip nested objects for now (handle at section level)
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          continue;
        }

        const source = configSources.get(path);
        const isLocked = lockedSettings.includes(path);

        settings.push({
          key,
          path,
          value,
          source,
          isLocked,
          isModified: source !== undefined && source !== 'default',
        });
      }

      return {
        name: sectionName,
        path: basePath,
        settings,
      };
    };

    // Process top-level sections
    for (const [sectionKey, sectionValue] of Object.entries(mergedConfig)) {
      if (typeof sectionValue === 'object' && sectionValue !== null && !Array.isArray(sectionValue)) {
        // Filter by category if specified
        if (category && sectionKey !== category) continue;

        const section = processObject(
          sectionValue as Record<string, unknown>,
          sectionKey,
          sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)
        );

        // Filter settings by search
        if (searchFilter) {
          const filter = searchFilter.toLowerCase();
          section.settings = section.settings.filter(
            (s) =>
              s.key.toLowerCase().includes(filter) ||
              formatValue(s.value).toLowerCase().includes(filter)
          );
        }

        // Only show modified if not showing all
        if (!showAll) {
          section.settings = section.settings.filter((s) => s.isModified);
        }

        if (section.settings.length > 0) {
          result.push(section);
        }
      }
    }

    return result;
  }, [mergedConfig, configSources, lockedSettings, showAll, category, searchFilter]);

  /**
   * Toggle section expansion
   */
  const toggleSection = (sectionPath: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionPath)) {
        next.delete(sectionPath);
      } else {
        next.add(sectionPath);
      }
      return next;
    });
  };

  /**
   * Check if section is expanded
   */
  const isSectionExpanded = (sectionPath: string): boolean => {
    return expandAll || expandedSections.has(sectionPath);
  };

  return (
    <div className={`configuration-viewer ${className}`}>
      <div className="viewer-header">
        <h3>Configuration</h3>
        {lastUpdated && (
          <span className="last-updated">
            Last updated: {new Date(lastUpdated).toLocaleString()}
          </span>
        )}
      </div>

      {sections.length === 0 ? (
        <div className="no-settings">
          {searchFilter ? 'No settings match your search.' : 'No configuration loaded.'}
        </div>
      ) : (
        <div className="sections">
          {sections.map((section) => (
            <div key={section.path} className="config-section">
              <button
                className="section-header"
                onClick={() => toggleSection(section.path)}
                aria-expanded={isSectionExpanded(section.path)}
              >
                <span className="section-icon">
                  {isSectionExpanded(section.path) ? '▼' : '▶'}
                </span>
                <span className="section-name">{section.name}</span>
                <span className="setting-count">{section.settings.length} settings</span>
              </button>

              {isSectionExpanded(section.path) && (
                <div className="section-content">
                  <table className="settings-table">
                    <thead>
                      <tr>
                        <th>Setting</th>
                        <th>Value</th>
                        <th>Source</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.settings.map((setting) => (
                        <tr
                          key={setting.path}
                          className={`setting-row ${selectedSetting === setting.path ? 'selected' : ''}`}
                          onClick={() => setSelectedSetting(setting.path)}
                        >
                          <td className="setting-key">
                            {setting.key}
                            {setting.isLocked && <LockedSettingBadge category={section.path} settingKey={setting.key} />}
                          </td>
                          <td className="setting-value">
                            <code>{formatValue(setting.value)}</code>
                          </td>
                          <td className="setting-source">
                            {setting.source && <ConfigSourceBadge source={setting.source as 'default' | 'system' | 'user' | 'file' | 'remote' | 'env' | 'cli' | 'gpo' | 'mdm'} />}
                          </td>
                          <td className="setting-status">
                            {setting.isModified && (
                              <span className="modified-badge">Modified</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedSetting && (
        <div className="setting-detail">
          <h4>Setting Details</h4>
          <dl>
            <dt>Path</dt>
            <dd><code>{selectedSetting}</code></dd>
            <dt>Source</dt>
            <dd>{configSources.get(selectedSetting) || 'default'}</dd>
            <dt>Locked</dt>
            <dd>{lockedSettings.includes(selectedSetting) ? 'Yes' : 'No'}</dd>
          </dl>
          <button
            className="close-detail"
            onClick={() => setSelectedSetting(null)}
          >
            Close
          </button>
        </div>
      )}

      <style>{`
        .configuration-viewer {
          font-family: var(--font-family, system-ui);
        }

        .viewer-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .viewer-header h3 {
          margin: 0;
        }

        .last-updated {
          font-size: 0.875rem;
          color: var(--text-secondary, #666);
        }

        .no-settings {
          padding: 2rem;
          text-align: center;
          color: var(--text-secondary, #666);
        }

        .config-section {
          border: 1px solid var(--border-color, #ddd);
          border-radius: 4px;
          margin-bottom: 0.5rem;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.75rem 1rem;
          background: var(--bg-secondary, #f5f5f5);
          border: none;
          cursor: pointer;
          text-align: left;
        }

        .section-header:hover {
          background: var(--bg-hover, #eee);
        }

        .section-icon {
          font-size: 0.75rem;
        }

        .section-name {
          font-weight: 600;
          flex: 1;
        }

        .setting-count {
          font-size: 0.875rem;
          color: var(--text-secondary, #666);
        }

        .section-content {
          padding: 0;
        }

        .settings-table {
          width: 100%;
          border-collapse: collapse;
        }

        .settings-table th,
        .settings-table td {
          padding: 0.5rem 1rem;
          text-align: left;
          border-bottom: 1px solid var(--border-color, #ddd);
        }

        .settings-table th {
          background: var(--bg-secondary, #f5f5f5);
          font-weight: 600;
          font-size: 0.875rem;
        }

        .setting-row {
          cursor: pointer;
        }

        .setting-row:hover {
          background: var(--bg-hover, #f9f9f9);
        }

        .setting-row.selected {
          background: var(--bg-selected, #e3f2fd);
        }

        .setting-key {
          font-weight: 500;
        }

        .setting-value code {
          font-family: monospace;
          font-size: 0.875rem;
          background: var(--bg-code, #f5f5f5);
          padding: 0.125rem 0.25rem;
          border-radius: 2px;
        }

        .modified-badge {
          display: inline-block;
          padding: 0.125rem 0.5rem;
          font-size: 0.75rem;
          background: var(--color-warning-bg, #fff3cd);
          color: var(--color-warning, #856404);
          border-radius: 2px;
        }

        .setting-detail {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 1rem;
          background: var(--bg-surface, white);
          border-top: 2px solid var(--border-color, #ddd);
          box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
        }

        .setting-detail h4 {
          margin: 0 0 0.5rem 0;
        }

        .setting-detail dl {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 0.25rem 1rem;
          margin: 0;
        }

        .setting-detail dt {
          font-weight: 600;
        }

        .close-detail {
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background: var(--bg-secondary, #f5f5f5);
          border: 1px solid var(--border-color, #ddd);
          border-radius: 4px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

export default ConfigurationViewer;
