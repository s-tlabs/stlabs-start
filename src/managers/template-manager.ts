import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import { AuthManager } from './auth-manager';

export interface Template {
  key: string;
  name: string;
  description: string;
  category: string;
  stack: string[];
  features: string[];
  variables: {
    required: string[];
    optional: string[];
    generated: string[];
  };
  supports: string[];
  postInstall: string[];
}

export interface TemplateConfig {
  name: string;
  prompts: any[];
  conditionalPrompts?: Record<string, any[]>;
  generatedVars?: Record<string, any>;
}

export class TemplateManager {
  private templatesUrl = 'https://api.github.com/repos/s-tlabs/boilerplates/contents/templates.json';
  private rawUrl = 'https://raw.githubusercontent.com/s-tlabs/boilerplates/main/templates.json';
  private cacheDir = path.join(process.cwd(), '.templates-cache');
  private authManager = new AuthManager();

  async getAvailableTemplates(): Promise<Template[]> {
    try {
      // Try to load from cache first
      const cacheFile = path.join(this.cacheDir, 'templates.json');
      
      try {
        const cachedData = await fs.readFile(cacheFile, 'utf-8');
        const cached = JSON.parse(cachedData);
        
        // Check if cache is less than 1 hour old
        const cacheAge = Date.now() - cached.timestamp;
        if (cacheAge < 3600000) { // 1 hour
          return Object.entries(cached.templates).map(([key, template]: [string, any]) => ({
            key,
            ...template
          }));
        }
      } catch (error) {
        // Cache doesn't exist or is invalid, continue to fetch
      }

      // Fetch from remote
      const headers = await this.authManager.getAuthHeaders();
      console.log('🔍 Fetching templates from:', this.templatesUrl);
      console.log('🔑 Using headers:', Object.keys(headers).length > 2 ? 'Authenticated' : 'Anonymous');
      
      let templatesData;
      
      try {
        // Try GitHub API first (works with private repos)
        const response = await axios.get(this.templatesUrl, { headers });
        
        if (response.data.content) {
          // Decode base64 content from GitHub API
          const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
          templatesData = JSON.parse(content);
        } else {
          throw new Error('No content in API response');
        }
      } catch (apiError) {
        console.log('🔄 API failed, trying raw URL...');
        // Fallback to raw URL (works with public repos)
        const rawResponse = await axios.get(this.rawUrl, { headers });
        templatesData = rawResponse.data;
      }

      // Save to cache
      await this.ensureCacheDir();
      await fs.writeFile(
        cacheFile,
        JSON.stringify({
          timestamp: Date.now(),
          templates: templatesData.templates
        }),
        'utf-8'
      );

      return Object.entries(templatesData.templates).map(([key, template]: [string, any]) => ({
        key,
        ...template
      }));
    } catch (error) {
      // Show error and use fallback templates
      console.error('⚠️  Failed to fetch templates from remote repository');
      console.error('Error:', error instanceof Error ? error.message : String(error));
      console.log();
      console.log('💡 Using default templates...');
      console.log('• Make sure the repository s-tlabs/boilerplates exists');
      console.log('• Create templates.json file in the repository root');
      console.log('• Check GitHub authentication: stlabs-start auth --view');
      console.log('• Verify repository access permissions');
      return this.getDefaultTemplates();
    }
  }

  async getTemplateConfig(templateName: string): Promise<TemplateConfig> {
    try {
      const apiUrl = `https://api.github.com/repos/s-tlabs/boilerplates/contents/${templateName}/template.json`;
      const rawUrl = `https://raw.githubusercontent.com/s-tlabs/boilerplates/main/${templateName}/template.json`;
      const headers = await this.authManager.getAuthHeaders();
      
      try {
        // Try GitHub API first (works with private repos)
        const response = await axios.get(apiUrl, { headers });
        
        if (response.data.content) {
          // Decode base64 content from GitHub API
          const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
          return JSON.parse(content);
        } else {
          throw new Error('No content in API response');
        }
      } catch (apiError) {
        // Fallback to raw URL (works with public repos)
        const rawResponse = await axios.get(rawUrl, { headers });
        return rawResponse.data;
      }
    } catch (error) {
      // Return default config if template config not found
      return {
        name: templateName,
        prompts: [],
        generatedVars: {}
      };
    }
  }

  async validateTemplate(templateName: string): Promise<boolean> {
    const templates = await this.getAvailableTemplates();
    return templates.some(template => template.key === templateName);
  }

  private async ensureCacheDir(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      // Directory already exists or creation failed
    }
  }

  private getDefaultTemplates(): Template[] {
    return [
      {
        key: 'nextjs-nextauth-postgres',
        name: 'Next.js + NextAuth + PostgreSQL',
        description: 'Fullstack app with authentication and database',
        category: 'fullstack',
        stack: ['nextjs', 'nextauth', 'prisma', 'postgresql', 'shadcn'],
        features: ['Authentication', 'Database', 'UI Components', 'TypeScript'],
        variables: {
          required: ['nextauthSecret', 'databaseUrl'],
          optional: ['googleClientId', 'githubClientId'],
          generated: ['nextauthUrl']
        },
        supports: ['google-oauth', 'github-oauth', 'email-auth'],
        postInstall: ['npm install', 'npx prisma generate', 'npx prisma db push']
      },
      {
        key: 'nextjs-clerk-supabase',
        name: 'Next.js + Clerk + Supabase',
        description: 'Modern stack with Clerk authentication and Supabase backend',
        category: 'fullstack',
        stack: ['nextjs', 'clerk', 'supabase', 'tailwind'],
        features: ['Authentication', 'Database', 'Real-time', 'TypeScript'],
        variables: {
          required: ['clerkPublishableKey', 'clerkSecretKey', 'supabaseUrl', 'supabaseAnonKey'],
          optional: ['supabaseServiceKey'],
          generated: []
        },
        supports: ['social-auth', 'email-auth'],
        postInstall: ['npm install']
      },
      {
        key: 'nestjs-jwt-postgres',
        name: 'NestJS + JWT + PostgreSQL',
        description: 'Backend API with JWT authentication and PostgreSQL',
        category: 'backend',
        stack: ['nestjs', 'jwt', 'prisma', 'postgresql'],
        features: ['REST API', 'Authentication', 'Database', 'TypeScript'],
        variables: {
          required: ['jwtSecret', 'databaseUrl'],
          optional: ['apiPort', 'corsOrigins'],
          generated: ['apiPrefix']
        },
        supports: ['jwt-auth', 'swagger'],
        postInstall: ['npm install', 'npx prisma generate']
      },
      {
        key: 'react-vite-tailwind',
        name: 'React + Vite + Tailwind',
        description: 'Modern React frontend with Vite and Tailwind CSS',
        category: 'frontend',
        stack: ['react', 'vite', 'tailwind', 'typescript'],
        features: ['Fast HMR', 'Tailwind CSS', 'TypeScript', 'ESLint'],
        variables: {
          required: [],
          optional: ['apiBaseUrl'],
          generated: []
        },
        supports: ['hot-reload', 'css-framework'],
        postInstall: ['npm install']
      }
    ];
  }
}