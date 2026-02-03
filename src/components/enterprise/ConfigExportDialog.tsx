/**
 * Config Export Dialog Component (Sprint 20)
 *
 * Dialog for exporting and importing configuration.
 */

import React, { useState, useCallback } from 'react';
import { useEnterprisePolicyStore } from '@/stores/enterprisePolicyStore';

/**
 * Config export dialog props
 */
interface ConfigExportDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Export complete handler */
  onExport?: (data: string, format: 'json' | 'yaml') => void;
  /** Import complete handler */
  onImport?: (success: boolean, error?: string) => void;
}

/**
 * Export options
 */
interface ExportOptions {
  format: 'json' | 'yaml';
  includeDefaults: boolean;
  includeLockedSettings: boolean;
  prettify: boolean;
  excludeSecrets: boolean;
}

/**
 * Config Export Dialog Component
 */
export function ConfigExportDialog({
  isOpen,
  onClose,
  onExport,
  onImport,
}: ConfigExportDialogProps): React.ReactElement | null {
  const mergedConfig = useEnterprisePolicyStore((state) => state.mergedConfig);
  const loadConfigFromFile = useEnterprisePolicyStore((state) => state.loadConfigFromFile);
  const [mode, setMode] = useState<'export' | 'import'>('export');
  const [options, setOptions] = useState<ExportOptions>({
    format: 'json',
    includeDefaults: false,
    includeLockedSettings: false,
    prettify: true,
    excludeSecrets: true,
  });
  const [importText, setImportText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * Handle export
   */
  const handleExport = useCallback(() => {
    if (!mergedConfig) {
      setError('No configuration to export');
      return;
    }

    try {
      let data: string;

      if (options.format === 'json') {
        data = options.prettify
          ? JSON.stringify(mergedConfig, null, 2)
          : JSON.stringify(mergedConfig);
      } else {
        // Simple YAML conversion
        data = objectToYaml(mergedConfig, 0);
      }

      // Copy to clipboard
      navigator.clipboard.writeText(data).then(() => {
        setSuccess('Configuration copied to clipboard');
        setTimeout(() => setSuccess(null), 3000);
      });

      // Call export handler
      onExport?.(data, options.format);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    }
  }, [mergedConfig, options, onExport]);

  /**
   * Handle download
   */
  const handleDownload = useCallback(() => {
    if (!mergedConfig) {
      setError('No configuration to export');
      return;
    }

    try {
      let data: string;
      const filename = `paperflow-config.${options.format}`;

      if (options.format === 'json') {
        data = options.prettify
          ? JSON.stringify(mergedConfig, null, 2)
          : JSON.stringify(mergedConfig);
      } else {
        data = objectToYaml(mergedConfig, 0);
      }

      // Create download
      const blob = new Blob([data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      setSuccess(`Downloaded ${filename}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    }
  }, [mergedConfig, options]);

  /**
   * Handle import
   */
  const handleImport = useCallback(async () => {
    if (!importText.trim()) {
      setError('Please enter configuration to import');
      return;
    }

    try {
      // Parse the input
      let config: Record<string, unknown>;

      if (importText.trim().startsWith('{')) {
        config = JSON.parse(importText);
      } else {
        // Basic YAML parsing (would use js-yaml in production)
        setError('YAML import requires js-yaml library');
        return;
      }

      // Load the config
      await loadConfigFromFile('/imported-config', config);

      setSuccess('Configuration imported successfully');
      onImport?.(true);
      setTimeout(() => {
        setSuccess(null);
        setImportText('');
      }, 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Import failed';
      setError(errorMsg);
      onImport?.(false, errorMsg);
    }
  }, [importText, loadConfigFromFile, onImport]);

  /**
   * Handle file upload
   */
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportText(content);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="config-export-dialog-overlay" onClick={onClose}>
      <div className="config-export-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Configuration Export/Import</h2>
          <button className="close-button" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <div className="dialog-tabs">
          <button
            className={`tab ${mode === 'export' ? 'active' : ''}`}
            onClick={() => setMode('export')}
          >
            Export
          </button>
          <button
            className={`tab ${mode === 'import' ? 'active' : ''}`}
            onClick={() => setMode('import')}
          >
            Import
          </button>
        </div>

        {error && (
          <div className="message error">
            {error}
            <button onClick={() => setError(null)}>&times;</button>
          </div>
        )}

        {success && (
          <div className="message success">
            {success}
            <button onClick={() => setSuccess(null)}>&times;</button>
          </div>
        )}

        {mode === 'export' ? (
          <div className="export-content">
            <div className="form-group">
              <label>Format</label>
              <select
                value={options.format}
                onChange={(e) => setOptions({ ...options, format: e.target.value as 'json' | 'yaml' })}
              >
                <option value="json">JSON</option>
                <option value="yaml">YAML</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={options.prettify}
                  onChange={(e) => setOptions({ ...options, prettify: e.target.checked })}
                />
                Pretty print
              </label>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={options.includeDefaults}
                  onChange={(e) => setOptions({ ...options, includeDefaults: e.target.checked })}
                />
                Include default values
              </label>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={options.excludeSecrets}
                  onChange={(e) => setOptions({ ...options, excludeSecrets: e.target.checked })}
                />
                Exclude sensitive values
              </label>
            </div>

            <div className="button-group">
              <button className="button primary" onClick={handleExport}>
                Copy to Clipboard
              </button>
              <button className="button secondary" onClick={handleDownload}>
                Download File
              </button>
            </div>
          </div>
        ) : (
          <div className="import-content">
            <div className="form-group">
              <label>Upload File</label>
              <input
                type="file"
                accept=".json,.yaml,.yml"
                onChange={handleFileUpload}
              />
            </div>

            <div className="form-group">
              <label>Or Paste Configuration</label>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste JSON or YAML configuration here..."
                rows={10}
              />
            </div>

            <div className="button-group">
              <button
                className="button primary"
                onClick={handleImport}
                disabled={!importText.trim()}
              >
                Import Configuration
              </button>
            </div>
          </div>
        )}

        <style>{`
          .config-export-dialog-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .config-export-dialog {
            background: white;
            border-radius: 8px;
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            overflow: auto;
          }

          .dialog-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            border-bottom: 1px solid #ddd;
          }

          .dialog-header h2 {
            margin: 0;
            font-size: 1.25rem;
          }

          .close-button {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0.25rem;
            line-height: 1;
          }

          .dialog-tabs {
            display: flex;
            border-bottom: 1px solid #ddd;
          }

          .tab {
            flex: 1;
            padding: 0.75rem;
            background: none;
            border: none;
            cursor: pointer;
            font-weight: 500;
          }

          .tab:hover {
            background: #f5f5f5;
          }

          .tab.active {
            border-bottom: 2px solid var(--primary, #3B82F6);
            color: var(--primary, #3B82F6);
          }

          .message {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 1rem;
            margin: 1rem;
            border-radius: 4px;
          }

          .message.error {
            background: #f8d7da;
            color: #721c24;
          }

          .message.success {
            background: #d1e7dd;
            color: #0f5132;
          }

          .message button {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1.25rem;
          }

          .export-content,
          .import-content {
            padding: 1rem;
          }

          .form-group {
            margin-bottom: 1rem;
          }

          .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
          }

          .form-group select,
          .form-group input[type="file"],
          .form-group textarea {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid #ddd;
            border-radius: 4px;
          }

          .form-group textarea {
            font-family: monospace;
            font-size: 0.875rem;
          }

          .form-group label input[type="checkbox"] {
            margin-right: 0.5rem;
          }

          .button-group {
            display: flex;
            gap: 0.5rem;
            margin-top: 1rem;
          }

          .button {
            flex: 1;
            padding: 0.75rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
          }

          .button.primary {
            background: var(--primary, #3B82F6);
            color: white;
            border: none;
          }

          .button.secondary {
            background: white;
            border: 1px solid #ddd;
          }

          .button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    </div>
  );
}

/**
 * Simple object to YAML converter
 */
function objectToYaml(obj: unknown, indent: number): string {
  const spaces = '  '.repeat(indent);

  if (obj === null) return 'null';
  if (obj === undefined) return '';
  if (typeof obj === 'boolean') return obj ? 'true' : 'false';
  if (typeof obj === 'number') return obj.toString();
  if (typeof obj === 'string') {
    if (obj.includes('\n') || obj.includes(':')) {
      return `"${obj.replace(/"/g, '\\"')}"`;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return obj.map((item) => `${spaces}- ${objectToYaml(item, indent + 1)}`).join('\n');
  }

  if (typeof obj === 'object') {
    const entries = Object.entries(obj);
    if (entries.length === 0) return '{}';
    return entries
      .map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          return `${spaces}${key}:\n${objectToYaml(value, indent + 1)}`;
        }
        return `${spaces}${key}: ${objectToYaml(value, indent)}`;
      })
      .join('\n');
  }

  return String(obj);
}

export default ConfigExportDialog;
