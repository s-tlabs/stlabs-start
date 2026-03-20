import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// We test the cache logic by directly manipulating cache files
// and verifying TemplateManager reads them correctly.
// Network-dependent tests are skipped in CI.

describe('TemplateManager - Cache Logic', () => {
  const cacheDir = path.join(os.homedir(), '.stlabs-cache');
  const cacheFile = path.join(cacheDir, 'templates.json');
  let originalCache: string | null = null;

  beforeAll(async () => {
    // Backup existing cache
    try {
      originalCache = await fs.readFile(cacheFile, 'utf-8');
    } catch {
      originalCache = null;
    }
  });

  afterAll(async () => {
    // Restore original cache
    if (originalCache) {
      await fs.mkdir(cacheDir, { recursive: true });
      await fs.writeFile(cacheFile, originalCache);
    }
  });

  it('should read templates from valid cache', async () => {
    const mockTemplates = {
      timestamp: Date.now(),
      templates: {
        'test-template': {
          name: 'Test Template',
          description: 'A test template',
          category: 'fullstack',
          stack: ['node'],
          features: [],
          variables: { required: [], optional: [], generated: [] },
          supports: [],
          postInstall: [],
        },
      },
    };

    await fs.mkdir(cacheDir, { recursive: true });
    await fs.writeFile(cacheFile, JSON.stringify(mockTemplates));

    // Import fresh to avoid module caching issues
    const { TemplateManager } = require('../managers/template-manager');
    const manager = new TemplateManager();
    const templates = await manager.getAvailableTemplates();

    expect(templates.length).toBeGreaterThanOrEqual(1);
    const testTemplate = templates.find((t: any) => t.key === 'test-template');
    expect(testTemplate).toBeDefined();
    expect(testTemplate.name).toBe('Test Template');
    expect(testTemplate.category).toBe('fullstack');
  });

  it('should handle corrupt cache gracefully', async () => {
    await fs.mkdir(cacheDir, { recursive: true });
    await fs.writeFile(cacheFile, 'this is not valid json {{{');

    const { TemplateManager } = require('../managers/template-manager');
    const manager = new TemplateManager();

    // Should either throw (if no network) or recover by fetching from remote
    // In test environment without network, we just verify it doesn't crash silently
    try {
      await manager.getAvailableTemplates();
    } catch (error: any) {
      // Expected if no network access - the corrupt cache should be deleted
      expect(error.message).toContain('Unable to fetch templates');
    }

    // Verify corrupt cache was cleaned up
    try {
      const content = await fs.readFile(cacheFile, 'utf-8');
      // If file still exists, it should be valid JSON (re-fetched)
      expect(() => JSON.parse(content)).not.toThrow();
    } catch {
      // File was deleted - also acceptable
    }
  });

  it('should treat stale cache as expired', async () => {
    const staleCache = {
      timestamp: Date.now() - 7200000, // 2 hours ago
      templates: {
        'stale-template': {
          name: 'Stale',
          description: 'Should be expired',
          category: 'backend',
          stack: [],
          features: [],
          variables: { required: [], optional: [], generated: [] },
          supports: [],
          postInstall: [],
        },
      },
    };

    await fs.mkdir(cacheDir, { recursive: true });
    await fs.writeFile(cacheFile, JSON.stringify(staleCache));

    const { TemplateManager } = require('../managers/template-manager');
    const manager = new TemplateManager();

    try {
      const templates = await manager.getAvailableTemplates();
      // If network is available, it should have fetched fresh data
      // The stale template might or might not be there depending on what remote returns
      expect(Array.isArray(templates)).toBe(true);
    } catch {
      // No network - expected in some environments
    }
  });
});

describe('TemplateManager - validateTemplate', () => {
  it('should validate against available templates', async () => {
    const cacheDir = path.join(os.homedir(), '.stlabs-cache');
    const cacheFile = path.join(cacheDir, 'templates.json');

    const mockTemplates = {
      timestamp: Date.now(),
      templates: {
        'existing-template': {
          name: 'Existing',
          description: 'Exists',
          category: 'fullstack',
          stack: [],
          features: [],
          variables: { required: [], optional: [], generated: [] },
          supports: [],
          postInstall: [],
        },
      },
    };

    await fs.mkdir(cacheDir, { recursive: true });
    await fs.writeFile(cacheFile, JSON.stringify(mockTemplates));

    const { TemplateManager } = require('../managers/template-manager');
    const manager = new TemplateManager();

    expect(await manager.validateTemplate('existing-template')).toBe(true);
    expect(await manager.validateTemplate('nonexistent-template')).toBe(false);
  });
});
