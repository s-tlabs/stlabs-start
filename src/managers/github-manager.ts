import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import Handlebars from 'handlebars';
import { promises as fsPromises } from 'fs';
import { AuthManager } from './auth-manager';

export class GitHubManager {
  private templatesRepo = 's-tlabs/boilerplates';
  private tempDir = path.join(process.cwd(), '.temp');
  private authManager = new AuthManager();

  async downloadTemplate(templateName: string, projectName: string): Promise<void> {
    const templateUrl = `https://api.github.com/repos/${this.templatesRepo}/contents/${templateName}`;
    const projectPath = path.join(process.cwd(), projectName);

    // Ensure project directory exists
    await fs.ensureDir(projectPath);

    try {
      // Download template files recursively
      console.log(`🔍 Attempting to download from: ${templateUrl}`);
      await this.downloadDirectory(templateUrl, projectPath);
      console.log('✅ Template downloaded successfully');
    } catch (error) {
      console.error('❌ Failed to download template from GitHub');
      console.error('Error:', error instanceof Error ? error.message : String(error));
      console.log();
      console.log('💡 Troubleshooting tips:');
      console.log('• Verify the template exists in the repository');
      console.log('• Check GitHub authentication: stlabs-start auth --view');
      console.log('• Ensure repository access permissions');
      console.log('• Try a different template from the available list');
      
      throw new Error(`Template '${templateName}' not found or not accessible. Please check the repository and try again.`);
    }
  }

  async processTemplateFiles(projectPath: string, variables: Record<string, any>): Promise<void> {
    const projectDir = path.join(process.cwd(), projectPath);
    
    // Process all .hbs files
    await this.processDirectory(projectDir, variables);
  }

  private async downloadDirectory(apiUrl: string, targetPath: string): Promise<void> {
    const headers = await this.authManager.getAuthHeaders();
    console.log(`📡 Fetching directory: ${apiUrl}`);
    console.log(`🔑 Auth headers: ${Object.keys(headers).length > 2 ? 'Authenticated' : 'Anonymous'}`);
    
    const response = await axios.get(apiUrl, { headers });
    const items = response.data;
    
    console.log(`📁 Found ${items.length} items in directory`);
    items.forEach((item: any) => {
      console.log(`  ${item.type === 'dir' ? '📁' : '📄'} ${item.name}`);
    });

    for (const item of items) {
      const itemPath = path.join(targetPath, item.name);

      if (item.type === 'file') {
        // Download file content
        const fileResponse = await axios.get(item.download_url, { 
          responseType: 'arraybuffer' 
        });
        await fs.writeFile(itemPath, fileResponse.data);
      } else if (item.type === 'dir') {
        // Create directory and recursively download contents
        await fs.ensureDir(itemPath);
        await this.downloadDirectory(item.url, itemPath);
      }
    }
  }

  private async processDirectory(dirPath: string, variables: Record<string, any>): Promise<void> {
    const items = await fsPromises.readdir(dirPath, { withFileTypes: true });

    for (const item of items) {
      const itemPath = path.join(dirPath, item.name);

      if (item.isDirectory()) {
        await this.processDirectory(itemPath, variables);
      } else if (item.isFile()) {
        if (item.name.endsWith('.hbs')) {
          // Process Handlebars template
          await this.processHandlebarsFile(itemPath, variables);
        } else {
          // Process regular file for variable replacement
          await this.processRegularFile(itemPath, variables);
        }
      }
    }
  }

  private async processHandlebarsFile(filePath: string, variables: Record<string, any>): Promise<void> {
    const content = await fsPromises.readFile(filePath, 'utf-8');
    const template = Handlebars.compile(content);
    const processedContent = template(variables);

    // Remove .hbs extension and write processed content
    const newFilePath = filePath.replace(/\.hbs$/, '');
    await fsPromises.writeFile(newFilePath, processedContent);
    await fsPromises.unlink(filePath); // Remove .hbs file
  }

  private async processRegularFile(filePath: string, variables: Record<string, any>): Promise<void> {
    // Skip binary files
    if (this.isBinaryFile(filePath)) {
      return;
    }

    const content = await fsPromises.readFile(filePath, 'utf-8');
    let processedContent = content;

    // Simple variable replacement for {{variableName}} patterns
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      processedContent = processedContent.replace(regex, String(value));
    }

    if (processedContent !== content) {
      await fsPromises.writeFile(filePath, processedContent);
    }
  }

  private isBinaryFile(filePath: string): boolean {
    const binaryExtensions = [
      '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg',
      '.woff', '.woff2', '.ttf', '.eot',
      '.exe', '.dll', '.so', '.dylib',
      '.zip', '.tar', '.gz', '.rar'
    ];

    const ext = path.extname(filePath).toLowerCase();
    return binaryExtensions.includes(ext);
  }

  private async createBasicTemplate(projectPath: string, templateName: string): Promise<void> {
    // Fallback: create basic project structure
    const templates: Record<string, () => Promise<void>> = {
      'nextjs-nextauth-postgres': () => this.createNextJSTemplate(projectPath),
      'nextjs-clerk-supabase': () => this.createNextJSTemplate(projectPath),
      'nestjs-jwt-postgres': () => this.createNestJSTemplate(projectPath),
      'react-vite-tailwind': () => this.createReactTemplate(projectPath)
    };

    const createTemplate = templates[templateName];
    if (createTemplate) {
      await createTemplate();
    } else {
      await this.createGenericTemplate(projectPath);
    }
  }

  private async createNextJSTemplate(projectPath: string): Promise<void> {
    const packageJson = {
      name: '{{projectName}}',
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint'
      },
      dependencies: {
        next: '^14.0.0',
        react: '^18.0.0',
        'react-dom': '^18.0.0'
      },
      devDependencies: {
        '@types/node': '^20.0.0',
        '@types/react': '^18.0.0',
        '@types/react-dom': '^18.0.0',
        typescript: '^5.0.0'
      }
    };

    await fs.writeJSON(path.join(projectPath, 'package.json.hbs'), packageJson, { spaces: 2 });
    
    const readmeContent = `# {{projectName}}

{{projectDescription}}

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Author

{{authorName}} <{{authorEmail}}>
`;

    await fs.writeFile(path.join(projectPath, 'README.md.hbs'), readmeContent);
  }

  private async createNestJSTemplate(projectPath: string): Promise<void> {
    const packageJson = {
      name: '{{projectName}}',
      version: '0.0.1',
      description: '{{projectDescription}}',
      scripts: {
        build: 'nest build',
        format: 'prettier --write "src/**/*.ts" "test/**/*.ts"',
        start: 'nest start',
        'start:dev': 'nest start --watch',
        'start:debug': 'nest start --debug --watch',
        'start:prod': 'node dist/main'
      },
      dependencies: {
        '@nestjs/common': '^10.0.0',
        '@nestjs/core': '^10.0.0',
        '@nestjs/platform-express': '^10.0.0',
        'reflect-metadata': '^0.1.13',
        rxjs: '^7.8.1'
      },
      devDependencies: {
        '@nestjs/cli': '^10.0.0',
        '@nestjs/schematics': '^10.0.0',
        '@types/node': '^20.3.1',
        typescript: '^5.1.3'
      }
    };

    await fs.writeJSON(path.join(projectPath, 'package.json.hbs'), packageJson, { spaces: 2 });
  }

  private async createReactTemplate(projectPath: string): Promise<void> {
    const packageJson = {
      name: '{{projectName}}',
      private: true,
      version: '0.0.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'tsc && vite build',
        lint: 'eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0',
        preview: 'vite preview'
      },
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0'
      },
      devDependencies: {
        '@types/react': '^18.2.15',
        '@types/react-dom': '^18.2.7',
        '@vitejs/plugin-react': '^4.0.3',
        typescript: '^5.0.2',
        vite: '^4.4.5'
      }
    };

    await fs.writeJSON(path.join(projectPath, 'package.json.hbs'), packageJson, { spaces: 2 });
  }

  private async createGenericTemplate(projectPath: string): Promise<void> {
    const packageJson = {
      name: '{{projectName}}',
      version: '1.0.0',
      description: '{{projectDescription}}',
      main: 'index.js',
      scripts: {
        start: 'node index.js'
      },
      author: '{{authorName}} <{{authorEmail}}>'
    };

    await fs.writeJSON(path.join(projectPath, 'package.json.hbs'), packageJson, { spaces: 2 });
  }
}