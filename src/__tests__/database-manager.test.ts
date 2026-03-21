// Test only the pure logic functions (detectDatabase) without importing inquirer
// DatabaseManager imports inquirer which is ESM-only, so we mock the module

jest.mock('inquirer', () => ({
  default: { prompt: jest.fn() },
  prompt: jest.fn(),
}));

jest.mock('chalk', () => ({
  default: {
    blue: jest.fn((s: string) => s),
    gray: jest.fn((s: string) => s),
    green: jest.fn((s: string) => s),
  },
  blue: jest.fn((s: string) => s),
  gray: jest.fn((s: string) => s),
  green: jest.fn((s: string) => s),
}));

import { DatabaseManager } from '../managers/database-manager';

describe('DatabaseManager', () => {
  let dbManager: DatabaseManager;

  beforeEach(() => {
    dbManager = new DatabaseManager();
  });

  describe('detectDatabase', () => {
    it('should detect postgresql from stack', () => {
      expect(dbManager.detectDatabase(['nextjs', 'postgresql', 'prisma'])).toBe('postgresql');
    });

    it('should detect postgres alias', () => {
      expect(dbManager.detectDatabase(['nestjs', 'postgres'])).toBe('postgresql');
    });

    it('should detect mysql from stack', () => {
      expect(dbManager.detectDatabase(['laravel', 'mysql'])).toBe('mysql');
    });

    it('should detect mongodb from stack', () => {
      expect(dbManager.detectDatabase(['express', 'mongodb'])).toBe('mongodb');
    });

    it('should detect mongo alias', () => {
      expect(dbManager.detectDatabase(['fastapi', 'mongo'])).toBe('mongodb');
    });

    it('should detect mariadb from stack', () => {
      expect(dbManager.detectDatabase(['php', 'mariadb'])).toBe('mariadb');
    });

    it('should return null when no database in stack', () => {
      expect(dbManager.detectDatabase(['react', 'vite', 'tailwind'])).toBeNull();
    });

    it('should return null for empty stack', () => {
      expect(dbManager.detectDatabase([])).toBeNull();
    });

    it('should be case-insensitive', () => {
      expect(dbManager.detectDatabase(['PostgreSQL'])).toBe('postgresql');
      expect(dbManager.detectDatabase(['MySQL'])).toBe('mysql');
      expect(dbManager.detectDatabase(['MongoDB'])).toBe('mongodb');
    });
  });
});
