import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import Handlebars from 'handlebars';
import { promises as fsPromises } from 'fs';
import { AuthManager } from './auth-manager';

export class GitHubManager {
  private templatesRepo = 's-tlabs/boilerplates';
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
      // Skip files that shouldn't be copied
      if (this.shouldSkipFile(item.name)) {
        console.log(`  ⏭️  Skipping: ${item.name}`);
        continue;
      }

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

  private shouldSkipFile(fileName: string): boolean {
    const skipFiles = [
      '.gitignore',
      '.git',
      'node_modules',
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',
      '.DS_Store',
      'Thumbs.db',
      '.env.local',
      '.env.example',
      '.stlabs-cache',
      '.stlabs-temp'
    ];

    return skipFiles.includes(fileName) || fileName.startsWith('.stlabs-');
  }


}