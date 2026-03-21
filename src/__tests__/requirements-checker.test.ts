import { RequirementsChecker } from '../managers/requirements-checker';

describe('RequirementsChecker', () => {
  let checker: RequirementsChecker;

  beforeEach(() => {
    checker = new RequirementsChecker();
  });

  describe('check', () => {
    it('should detect node as installed', async () => {
      const results = await checker.check(['node']);
      const nodeResult = results.find((r) => r.name === 'Node.js');

      expect(nodeResult).toBeDefined();
      expect(nodeResult!.installed).toBe(true);
      expect(nodeResult!.version).toBeDefined();
      expect(nodeResult!.required).toBe(true);
    });

    it('should detect git as installed', async () => {
      const results = await checker.check(['git']);
      const gitResult = results.find((r) => r.name === 'Git');

      expect(gitResult).toBeDefined();
      expect(gitResult!.installed).toBe(true);
      expect(gitResult!.version).toBeDefined();
    });

    it('should detect npm as installed', async () => {
      const results = await checker.check(['npm']);
      const npmResult = results.find((r) => r.name === 'npm');

      expect(npmResult).toBeDefined();
      expect(npmResult!.installed).toBe(true);
    });

    it('should mark unknown tool as not installed', async () => {
      const results = await checker.check(['nonexistent-tool-xyz']);
      expect(results[0].installed).toBe(false);
      expect(results[0].required).toBe(true);
    });

    it('should mark optional requirements correctly', async () => {
      const results = await checker.check(['node'], ['nonexistent-tool-xyz']);
      const optionalResult = results.find((r) => r.name === 'nonexistent-tool-xyz');

      expect(optionalResult).toBeDefined();
      expect(optionalResult!.required).toBe(false);
    });

    it('should handle empty requirements', async () => {
      const results = await checker.check([]);
      expect(results).toEqual([]);
    });

    it('should deduplicate requirements', async () => {
      const results = await checker.check(['node', 'node']);
      const nodeResults = results.filter((r) => r.name === 'Node.js');
      expect(nodeResults.length).toBe(1);
    });

    it('should check multiple requirements', async () => {
      const results = await checker.check(['node', 'git', 'npm']);
      expect(results.length).toBe(3);
      expect(results.every((r) => r.installed)).toBe(true);
    });
  });

  describe('printResults', () => {
    it('should return true when all required checks pass', () => {
      const results = [
        { name: 'Node.js', installed: true, version: '20.0.0', required: true, installUrl: '' },
        { name: 'Docker', installed: true, version: '24.0.0', required: true, installUrl: '' },
      ];

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const allOk = checker.printResults(results);
      consoleSpy.mockRestore();

      expect(allOk).toBe(true);
    });

    it('should return false when a required check fails', () => {
      const results = [
        { name: 'Node.js', installed: true, version: '20.0.0', required: true, installUrl: '' },
        { name: 'Docker', installed: false, required: true, installUrl: 'https://docker.com' },
      ];

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const allOk = checker.printResults(results);
      consoleSpy.mockRestore();

      expect(allOk).toBe(false);
    });

    it('should return true when only optional checks fail', () => {
      const results = [
        { name: 'Node.js', installed: true, version: '20.0.0', required: true, installUrl: '' },
        { name: 'Redis', installed: false, required: false, installUrl: 'https://redis.io' },
      ];

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const allOk = checker.printResults(results);
      consoleSpy.mockRestore();

      expect(allOk).toBe(true);
    });
  });
});
