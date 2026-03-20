import { ConfigManager } from '../managers/config-manager';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  let tmpDir: string;

  beforeEach(async () => {
    configManager = new ConfigManager();
    tmpDir = path.join(os.tmpdir(), 'stlabs-test-' + Date.now());
    await fs.mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  describe('loadConfig', () => {
    it('should return empty object when no path is provided', async () => {
      const result = await configManager.loadConfig();
      expect(result).toEqual({});
    });

    it('should load a valid JSON config file', async () => {
      const configPath = path.join(tmpDir, 'config.json');
      await fs.writeFile(configPath, JSON.stringify({ projectName: 'test', port: 3000 }));

      const result = await configManager.loadConfig(configPath);
      expect(result).toEqual({ projectName: 'test', port: 3000 });
    });

    it('should throw error for non-existent file', async () => {
      await expect(configManager.loadConfig('/nonexistent/config.json'))
        .rejects.toThrow('Failed to load configuration');
    });

    it('should throw error for invalid JSON', async () => {
      const configPath = path.join(tmpDir, 'bad.json');
      await fs.writeFile(configPath, 'not json {{{');

      await expect(configManager.loadConfig(configPath))
        .rejects.toThrow('Failed to load configuration');
    });
  });

  describe('saveConfig', () => {
    it('should save config to file', async () => {
      const configPath = path.join(tmpDir, 'output.json');
      await configManager.saveConfig({ projectName: 'test' }, configPath);

      const content = await fs.readFile(configPath, 'utf-8');
      expect(JSON.parse(content)).toEqual({ projectName: 'test' });
    });

    it('should create parent directories', async () => {
      const configPath = path.join(tmpDir, 'nested', 'dir', 'config.json');
      await configManager.saveConfig({ key: 'value' }, configPath);

      const content = await fs.readFile(configPath, 'utf-8');
      expect(JSON.parse(content)).toEqual({ key: 'value' });
    });
  });

  describe('validateConfig', () => {
    it('should pass when all required fields are present', () => {
      const config = { projectName: 'test', authorName: 'John' };
      expect(configManager.validateConfig(config, ['projectName', 'authorName'])).toBe(true);
    });

    it('should throw when a required field is missing', () => {
      const config = { projectName: 'test' };
      expect(() => configManager.validateConfig(config, ['projectName', 'authorName']))
        .toThrow('Required field "authorName" is missing');
    });

    it('should throw when a required field is empty', () => {
      const config = { projectName: '' };
      expect(() => configManager.validateConfig(config, ['projectName']))
        .toThrow('Required field "projectName" is missing');
    });
  });

  describe('generateVariables', () => {
    it('should pass through existing config values', () => {
      const config = { projectName: 'my-app', authorName: 'John' };
      const result = configManager.generateVariables('unknown-template', config);
      expect(result.projectName).toBe('my-app');
      expect(result.authorName).toBe('John');
    });

    it('should generate template-specific variables for nextjs-nextauth-postgres', () => {
      const config = { projectName: 'my-app' };
      const result = configManager.generateVariables('nextjs-nextauth-postgres', config);

      expect(result.nextauthSecret).toBeDefined();
      expect(typeof result.nextauthSecret).toBe('string');
      expect(result.nextauthSecret.length).toBe(64); // 32 bytes hex
      expect(result.nextauthUrl).toBe('http://localhost:3000');
      expect(result.databaseUrl).toContain('my_app');
    });

    it('should generate template-specific variables for nestjs-jwt-postgres', () => {
      const config = { projectName: 'api-service' };
      const result = configManager.generateVariables('nestjs-jwt-postgres', config);

      expect(result.jwtSecret).toBeDefined();
      expect(result.jwtSecret.length).toBe(128); // 64 bytes hex
      expect(result.apiPort).toBe(3001);
      expect(result.apiPrefix).toBe('/api/v1');
      expect(result.jwtExpiresIn).toBe('7d');
    });

    it('should not override user-provided values', () => {
      const config = { projectName: 'my-app', apiPort: 4000 };
      const result = configManager.generateVariables('nestjs-jwt-postgres', config);

      expect(result.apiPort).toBe(4000);
    });

    it('should return config as-is for unknown templates', () => {
      const config = { projectName: 'my-app', custom: 'value' };
      const result = configManager.generateVariables('unknown-template', config);
      expect(result).toEqual(config);
    });
  });

  describe('getDefaultPrompts', () => {
    it('should return prompts for known templates', async () => {
      const prompts = await configManager.getDefaultPrompts('nextjs-nextauth-postgres');
      expect(prompts.length).toBeGreaterThan(0);
      expect(prompts[0]).toHaveProperty('name');
      expect(prompts[0]).toHaveProperty('message');
    });

    it('should return empty array for unknown templates', async () => {
      const prompts = await configManager.getDefaultPrompts('unknown-template');
      expect(prompts).toEqual([]);
    });
  });
});
