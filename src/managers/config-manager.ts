import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface GlobalConfig {
  projectName: string;
  projectDescription?: string;
  authorName: string;
  authorEmail: string;
  gitRepository?: string;
}

export interface TemplateVariables {
  [key: string]: any;
}

export class ConfigManager {
  private configCache: Map<string, any> = new Map();

  async loadConfig(configPath?: string): Promise<any> {
    if (!configPath) {
      return {};
    }

    try {
      const configContent = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(configContent);
    } catch (error) {
      throw new Error(`Failed to load configuration from ${configPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async saveConfig(config: any, configPath: string): Promise<void> {
    try {
      const configDir = path.dirname(configPath);
      await fs.mkdir(configDir, { recursive: true });
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      throw new Error(`Failed to save configuration to ${configPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  generateVariables(templateName: string, config: any): TemplateVariables {
    const generators = this.getVariableGenerators();
    const generated: TemplateVariables = {};

    // Apply global variables
    Object.assign(generated, config);

    // Apply template-specific generators
    const templateGenerators = this.getTemplateGenerators(templateName);
    for (const [key, generator] of Object.entries(templateGenerators)) {
      if (!config[key]) {
        generated[key] = generator(config);
      }
    }

    return generated;
  }

  validateConfig(config: any, requiredFields: string[]): boolean {
    for (const field of requiredFields) {
      if (!config[field]) {
        throw new Error(`Required field "${field}" is missing from configuration`);
      }
    }
    return true;
  }

  private getVariableGenerators(): Record<string, (config: any) => any> {
    return {
      // Secrets and tokens
      nextauthSecret: () => crypto.randomBytes(32).toString('hex'),
      jwtSecret: () => crypto.randomBytes(64).toString('hex'),
      sessionSecret: () => crypto.randomBytes(32).toString('hex'),

      // URLs
      nextauthUrl: (config) => `http://localhost:3000`,
      apiBaseUrl: (config) => `http://localhost:3001/api`,
      
      // Database URLs
      databaseUrl: (config) => {
        const dbName = config.projectName.replace(/[^a-zA-Z0-9]/g, '_');
        return `postgresql://user:password@localhost:5432/${dbName}`;
      },

      // API Configuration
      apiPrefix: () => '/api/v1',
      apiPort: () => 3001,
      corsOrigins: () => ['http://localhost:3000'],

      // Default values
      jwtExpiresIn: () => '7d',
      smtpPort: () => 587,
    };
  }

  private getTemplateGenerators(templateName: string): Record<string, (config: any) => any> {
    const generators = this.getVariableGenerators();
    
    const templateSpecific: Record<string, Record<string, (config: any) => any>> = {
      'nextjs-nextauth-postgres': {
        nextauthSecret: generators.nextauthSecret,
        nextauthUrl: generators.nextauthUrl,
        databaseUrl: generators.databaseUrl,
      },
      
      'nextjs-clerk-supabase': {
        // Clerk and Supabase keys need to be provided by user
      },
      
      'nestjs-jwt-postgres': {
        jwtSecret: generators.jwtSecret,
        databaseUrl: generators.databaseUrl,
        apiPort: generators.apiPort,
        apiPrefix: generators.apiPrefix,
        corsOrigins: generators.corsOrigins,
        jwtExpiresIn: generators.jwtExpiresIn,
      },
      
      'react-vite-tailwind': {
        apiBaseUrl: generators.apiBaseUrl,
      }
    };

    return templateSpecific[templateName] || {};
  }

  async getDefaultPrompts(templateName: string): Promise<any[]> {
    const defaultPrompts: Record<string, any[]> = {
      'nextjs-nextauth-postgres': [
        {
          type: 'password',
          name: 'nextauthSecret',
          message: '🔐 NextAuth Secret (leave empty to auto-generate):',
          default: ''
        },
        {
          type: 'input',
          name: 'databaseUrl',
          message: '🗄️ Database URL:',
          default: 'postgresql://user:password@localhost:5432/{{projectName}}'
        },
        {
          type: 'confirm',
          name: 'enableGoogleAuth',
          message: '🔐 Enable Google OAuth?',
          default: false
        }
      ],
      
      'nextjs-clerk-supabase': [
        {
          type: 'input',
          name: 'clerkPublishableKey',
          message: '🔑 Clerk Publishable Key:',
          validate: (input: string) => input ? true : 'Clerk Publishable Key is required'
        },
        {
          type: 'password',
          name: 'clerkSecretKey',
          message: '🔒 Clerk Secret Key:',
          validate: (input: string) => input ? true : 'Clerk Secret Key is required'
        },
        {
          type: 'input',
          name: 'supabaseUrl',
          message: '🗄️ Supabase URL:',
          validate: (input: string) => input ? true : 'Supabase URL is required'
        },
        {
          type: 'password',
          name: 'supabaseAnonKey',
          message: '🔑 Supabase Anon Key:',
          validate: (input: string) => input ? true : 'Supabase Anon Key is required'
        }
      ],
      
      'nestjs-jwt-postgres': [
        {
          type: 'password',
          name: 'jwtSecret',
          message: '🔐 JWT Secret (leave empty to auto-generate):',
          default: ''
        },
        {
          type: 'input',
          name: 'databaseUrl',
          message: '🗄️ Database URL:',
          default: 'postgresql://user:password@localhost:5432/{{projectName}}'
        },
        {
          type: 'number',
          name: 'apiPort',
          message: '🚀 API Port:',
          default: 3001
        }
      ],
      
      'react-vite-tailwind': [
        {
          type: 'input',
          name: 'apiBaseUrl',
          message: '🌐 API Base URL (optional):',
          default: 'http://localhost:3001/api'
        }
      ]
    };

    return defaultPrompts[templateName] || [];
  }

  private getConditionalPrompts(templateName: string): Record<string, any[]> {
    const conditionalPrompts: Record<string, Record<string, any[]>> = {
      'nextjs-nextauth-postgres': {
        enableGoogleAuth: [
          {
            type: 'input',
            name: 'googleClientId',
            message: '🔑 Google Client ID:',
            validate: (input: string) => input ? true : 'Google Client ID is required when Google Auth is enabled'
          },
          {
            type: 'password',
            name: 'googleClientSecret',
            message: '🔒 Google Client Secret:',
            validate: (input: string) => input ? true : 'Google Client Secret is required when Google Auth is enabled'
          }
        ]
      }
    };

    return conditionalPrompts[templateName] || {};
  }
}