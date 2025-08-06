export const validators = {
  projectName: (value: string): boolean | string => {
    if (!value) return 'Project name is required';
    if (!/^[a-z][a-z0-9-]*$/.test(value)) {
      return 'Project name must start with a letter and contain only lowercase letters, numbers, and hyphens';
    }
    return true;
  },

  email: (value: string): boolean | string => {
    if (!value) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email address';
    }
    return true;
  },

  databaseUrl: (value: string): boolean | string => {
    if (!value) return 'Database URL is required';
    if (!value.includes('://')) {
      return 'Database URL must be a valid connection string';
    }
    return true;
  },

  url: (value: string): boolean | string => {
    if (!value) return true; // Optional field
    try {
      new URL(value);
      return true;
    } catch {
      return 'Please enter a valid URL';
    }
  },

  port: (value: string | number): boolean | string => {
    const port = typeof value === 'string' ? parseInt(value, 10) : value;
    if (isNaN(port)) return 'Port must be a number';
    if (port < 1 || port > 65535) return 'Port must be between 1 and 65535';
    return true;
  },

  required: (value: string): boolean | string => {
    return value && value.trim() ? true : 'This field is required';
  },

  googleClientId: (value: string): boolean | string => {
    if (!value) return 'Google Client ID is required';
    if (!value.includes('.googleusercontent.com')) {
      return 'Google Client ID should end with .googleusercontent.com';
    }
    return true;
  },

  clerkKey: (value: string): boolean | string => {
    if (!value) return 'Clerk key is required';
    if (!value.startsWith('pk_') && !value.startsWith('sk_')) {
      return 'Clerk key should start with pk_ or sk_';
    }
    return true;
  },

  supabaseUrl: (value: string): boolean | string => {
    if (!value) return 'Supabase URL is required';
    if (!value.includes('supabase.co') && !value.includes('localhost')) {
      return 'Please enter a valid Supabase URL';
    }
    return true;
  }
};