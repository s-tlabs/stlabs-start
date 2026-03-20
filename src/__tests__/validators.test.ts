import { validators } from '../utils/validators';

describe('validators', () => {
  describe('projectName', () => {
    it('should accept valid project names', () => {
      expect(validators.projectName('my-app')).toBe(true);
      expect(validators.projectName('app123')).toBe(true);
      expect(validators.projectName('a')).toBe(true);
    });

    it('should reject empty input', () => {
      expect(validators.projectName('')).toBe('Project name is required');
    });

    it('should reject names starting with number', () => {
      expect(validators.projectName('123app')).toEqual(expect.any(String));
    });

    it('should reject names with uppercase', () => {
      expect(validators.projectName('MyApp')).toEqual(expect.any(String));
    });

    it('should reject names with spaces', () => {
      expect(validators.projectName('my app')).toEqual(expect.any(String));
    });

    it('should reject names with special characters', () => {
      expect(validators.projectName('my_app')).toEqual(expect.any(String));
      expect(validators.projectName('my.app')).toEqual(expect.any(String));
    });
  });

  describe('email', () => {
    it('should accept valid emails', () => {
      expect(validators.email('user@example.com')).toBe(true);
      expect(validators.email('test@sub.domain.com')).toBe(true);
    });

    it('should reject empty input', () => {
      expect(validators.email('')).toBe('Email is required');
    });

    it('should reject invalid emails', () => {
      expect(validators.email('not-an-email')).toEqual(expect.any(String));
      expect(validators.email('missing@')).toEqual(expect.any(String));
      expect(validators.email('@no-user.com')).toEqual(expect.any(String));
    });
  });

  describe('databaseUrl', () => {
    it('should accept valid database URLs', () => {
      expect(validators.databaseUrl('postgresql://user:pass@localhost:5432/db')).toBe(true);
      expect(validators.databaseUrl('mongodb://localhost:27017/db')).toBe(true);
    });

    it('should reject empty input', () => {
      expect(validators.databaseUrl('')).toEqual(expect.any(String));
    });

    it('should reject URLs without protocol', () => {
      expect(validators.databaseUrl('localhost:5432/db')).toEqual(expect.any(String));
    });
  });

  describe('url', () => {
    it('should accept valid URLs', () => {
      expect(validators.url('https://example.com')).toBe(true);
      expect(validators.url('http://localhost:3000')).toBe(true);
    });

    it('should accept empty input (optional field)', () => {
      expect(validators.url('')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(validators.url('not-a-url')).toEqual(expect.any(String));
    });
  });

  describe('port', () => {
    it('should accept valid ports', () => {
      expect(validators.port(3000)).toBe(true);
      expect(validators.port(1)).toBe(true);
      expect(validators.port(65535)).toBe(true);
      expect(validators.port('8080')).toBe(true);
    });

    it('should reject invalid ports', () => {
      expect(validators.port(0)).toEqual(expect.any(String));
      expect(validators.port(65536)).toEqual(expect.any(String));
      expect(validators.port('abc')).toEqual(expect.any(String));
    });
  });

  describe('required', () => {
    it('should accept non-empty values', () => {
      expect(validators.required('hello')).toBe(true);
    });

    it('should reject empty or whitespace values', () => {
      expect(validators.required('')).toEqual(expect.any(String));
      expect(validators.required('   ')).toEqual(expect.any(String));
    });
  });

  describe('googleClientId', () => {
    it('should accept valid Google Client IDs', () => {
      expect(validators.googleClientId('123.apps.googleusercontent.com')).toBe(true);
    });

    it('should reject invalid IDs', () => {
      expect(validators.googleClientId('')).toEqual(expect.any(String));
      expect(validators.googleClientId('random-string')).toEqual(expect.any(String));
    });
  });

  describe('clerkKey', () => {
    it('should accept valid Clerk keys', () => {
      expect(validators.clerkKey('pk_test_abc')).toBe(true);
      expect(validators.clerkKey('sk_live_xyz')).toBe(true);
    });

    it('should reject invalid keys', () => {
      expect(validators.clerkKey('')).toEqual(expect.any(String));
      expect(validators.clerkKey('invalid_key')).toEqual(expect.any(String));
    });
  });

  describe('supabaseUrl', () => {
    it('should accept valid Supabase URLs', () => {
      expect(validators.supabaseUrl('https://abc.supabase.co')).toBe(true);
      expect(validators.supabaseUrl('http://localhost:54321')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(validators.supabaseUrl('')).toEqual(expect.any(String));
      expect(validators.supabaseUrl('https://example.com')).toEqual(expect.any(String));
    });
  });
});
