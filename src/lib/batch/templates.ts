/**
 * Batch Operation Templates
 * Allows users to save and reuse batch operation configurations.
 */

import type {
  BatchTemplate,
  BatchOperationType,
  BatchJobOptions,
} from '@/types/batch';
import {
  saveTemplate as persistTemplate,
  loadAllTemplates as fetchAllTemplates,
  deleteTemplate as removeTemplate,
} from './jobPersistence';

/**
 * Generate unique template ID
 */
function generateTemplateId(): string {
  return `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new batch template
 */
export function createTemplate(
  name: string,
  operationType: BatchOperationType,
  options: Partial<BatchJobOptions>,
  description?: string,
  icon?: string
): BatchTemplate {
  const now = Date.now();
  return {
    id: generateTemplateId(),
    name,
    description,
    operationType,
    options,
    createdAt: now,
    updatedAt: now,
    icon,
  };
}

/**
 * Update an existing template
 */
export function updateTemplate(
  template: BatchTemplate,
  updates: Partial<Omit<BatchTemplate, 'id' | 'createdAt'>>
): BatchTemplate {
  return {
    ...template,
    ...updates,
    updatedAt: Date.now(),
  };
}

/**
 * Clone a template with a new name
 */
export function cloneTemplate(
  template: BatchTemplate,
  newName: string
): BatchTemplate {
  const now = Date.now();
  return {
    ...template,
    id: generateTemplateId(),
    name: newName,
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Validate template options
 */
export function validateTemplateOptions(
  operationType: BatchOperationType,
  options: Partial<BatchJobOptions>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Common validations
  if (options.parallelism !== undefined && options.parallelism < 1) {
    errors.push('Parallelism must be at least 1');
  }
  if (options.maxRetries !== undefined && options.maxRetries < 0) {
    errors.push('Max retries cannot be negative');
  }

  // Operation-specific validations
  switch (operationType) {
    case 'compress':
      if (options.compress) {
        if (
          options.compress.imageQuality !== undefined &&
          (options.compress.imageQuality < 0.1 ||
            options.compress.imageQuality > 1.0)
        ) {
          errors.push('Image quality must be between 0.1 and 1.0');
        }
      }
      break;

    case 'merge':
      if (options.merge) {
        if (!options.merge.outputName) {
          errors.push('Output name is required for merge operations');
        }
      }
      break;

    case 'split':
      if (options.split) {
        if (
          options.split.method === 'page-count' &&
          (!options.split.pagesPerFile || options.split.pagesPerFile < 1)
        ) {
          errors.push('Pages per file must be at least 1');
        }
        if (
          options.split.method === 'file-size' &&
          (!options.split.maxFileSize || options.split.maxFileSize < 1024)
        ) {
          errors.push('Max file size must be at least 1KB');
        }
      }
      break;

    case 'watermark':
      if (options.watermark) {
        if (!options.watermark.content) {
          errors.push('Watermark content is required');
        }
        if (
          options.watermark.opacity !== undefined &&
          (options.watermark.opacity < 0 || options.watermark.opacity > 1)
        ) {
          errors.push('Watermark opacity must be between 0 and 1');
        }
      }
      break;

    case 'ocr':
      if (options.ocr) {
        if (!options.ocr.language) {
          errors.push('OCR language is required');
        }
      }
      break;

    case 'export-images':
      if (options.exportImages) {
        if (
          options.exportImages.dpi !== undefined &&
          (options.exportImages.dpi < 72 || options.exportImages.dpi > 600)
        ) {
          errors.push('DPI must be between 72 and 600');
        }
        if (
          options.exportImages.quality !== undefined &&
          (options.exportImages.quality < 0.1 ||
            options.exportImages.quality > 1.0)
        ) {
          errors.push('Quality must be between 0.1 and 1.0');
        }
      }
      break;
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Template manager class
 */
export class TemplateManager {
  private templates: Map<string, BatchTemplate> = new Map();
  private initialized = false;

  /**
   * Initialize templates from persistence
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const savedTemplates = await fetchAllTemplates();
      for (const template of savedTemplates) {
        this.templates.set(template.id, template);
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to load templates:', error);
      this.initialized = true;
    }
  }

  /**
   * Get all templates
   */
  async getAllTemplates(): Promise<BatchTemplate[]> {
    await this.initialize();
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by operation type
   */
  async getTemplatesByType(
    operationType: BatchOperationType
  ): Promise<BatchTemplate[]> {
    await this.initialize();
    return Array.from(this.templates.values()).filter(
      (t) => t.operationType === operationType
    );
  }

  /**
   * Get a template by ID
   */
  async getTemplate(templateId: string): Promise<BatchTemplate | undefined> {
    await this.initialize();
    return this.templates.get(templateId);
  }

  /**
   * Save a template
   */
  async saveTemplate(template: BatchTemplate): Promise<void> {
    await this.initialize();

    const validation = validateTemplateOptions(
      template.operationType,
      template.options
    );
    if (!validation.valid) {
      throw new Error(`Invalid template: ${validation.errors.join(', ')}`);
    }

    this.templates.set(template.id, template);

    try {
      await persistTemplate(template);
    } catch (error) {
      // If persistence fails, still keep in memory
      console.error('Failed to persist template:', error);
    }
  }

  /**
   * Delete a template
   */
  async deleteTemplate(templateId: string): Promise<boolean> {
    await this.initialize();

    const template = this.templates.get(templateId);
    if (!template) return false;

    // Don't allow deleting default templates
    if (template.isDefault) {
      throw new Error('Cannot delete default templates');
    }

    this.templates.delete(templateId);

    try {
      await removeTemplate(templateId);
    } catch (error) {
      console.error('Failed to delete template from persistence:', error);
    }

    return true;
  }

  /**
   * Create and save a new template
   */
  async createAndSave(
    name: string,
    operationType: BatchOperationType,
    options: Partial<BatchJobOptions>,
    description?: string,
    icon?: string
  ): Promise<BatchTemplate> {
    const template = createTemplate(name, operationType, options, description, icon);
    await this.saveTemplate(template);
    return template;
  }

  /**
   * Update and save a template
   */
  async updateAndSave(
    templateId: string,
    updates: Partial<Omit<BatchTemplate, 'id' | 'createdAt'>>
  ): Promise<BatchTemplate | undefined> {
    await this.initialize();

    const existing = this.templates.get(templateId);
    if (!existing) return undefined;

    // Don't allow updating default templates
    if (existing.isDefault) {
      throw new Error('Cannot modify default templates');
    }

    const updated = updateTemplate(existing, updates);
    await this.saveTemplate(updated);
    return updated;
  }

  /**
   * Clone a template
   */
  async cloneAndSave(
    templateId: string,
    newName: string
  ): Promise<BatchTemplate | undefined> {
    await this.initialize();

    const existing = this.templates.get(templateId);
    if (!existing) return undefined;

    const cloned = cloneTemplate(existing, newName);
    await this.saveTemplate(cloned);
    return cloned;
  }

  /**
   * Import templates from JSON
   */
  async importTemplates(json: string): Promise<number> {
    const templates: BatchTemplate[] = JSON.parse(json);
    let imported = 0;

    for (const template of templates) {
      // Generate new ID to avoid conflicts
      const newTemplate = {
        ...template,
        id: generateTemplateId(),
        isDefault: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      try {
        await this.saveTemplate(newTemplate);
        imported++;
      } catch (error) {
        console.error('Failed to import template:', template.name, error);
      }
    }

    return imported;
  }

  /**
   * Export templates to JSON
   */
  async exportTemplates(templateIds?: string[]): Promise<string> {
    await this.initialize();

    let templates = Array.from(this.templates.values());

    if (templateIds) {
      templates = templates.filter((t) => templateIds.includes(t.id));
    }

    // Exclude default templates from export
    templates = templates.filter((t) => !t.isDefault);

    return JSON.stringify(templates, null, 2);
  }

  /**
   * Get default templates (not persisted)
   */
  getDefaultTemplates(): BatchTemplate[] {
    // Dynamically import to avoid circular dependency issues
    return import('@/types/batch').then(({ DEFAULT_BATCH_TEMPLATES }) =>
      DEFAULT_BATCH_TEMPLATES.map(
        (
          t: Omit<BatchTemplate, 'id' | 'createdAt' | 'updatedAt'>,
          index: number
        ) => ({
          ...t,
          id: `default_${index}`,
          createdAt: 0,
          updatedAt: 0,
        })
      )
    ) as unknown as BatchTemplate[];
  }

  /**
   * Get default templates asynchronously
   */
  async getDefaultTemplatesAsync(): Promise<BatchTemplate[]> {
    const { DEFAULT_BATCH_TEMPLATES } = await import('@/types/batch');
    return DEFAULT_BATCH_TEMPLATES.map(
      (
        t: Omit<BatchTemplate, 'id' | 'createdAt' | 'updatedAt'>,
        index: number
      ) => ({
        ...t,
        id: `default_${index}`,
        createdAt: 0,
        updatedAt: 0,
      })
    );
  }
}

/**
 * Create a template manager instance
 */
export function createTemplateManager(): TemplateManager {
  return new TemplateManager();
}

// Singleton instance
let templateManagerInstance: TemplateManager | null = null;

/**
 * Get the singleton template manager
 */
export function getTemplateManager(): TemplateManager {
  if (!templateManagerInstance) {
    templateManagerInstance = createTemplateManager();
  }
  return templateManagerInstance;
}
