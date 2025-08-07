import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import Handlebars from 'handlebars';
import { promises as fsPromises } from 'fs';
import { AuthManager } from './auth-manager';

export class GitHubManager {
  private templatesRepo = 's-tlabs/boilerplates';
  private authManager = new AuthManager();

  private async retryRequest(requestFn: () => Promise<any>, maxRetries = 3, baseDelay = 1000): Promise<any> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error: any) {
        if (error.response?.status === 429 && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
          console.log(`\n⏳ Rate limited. Retrying in ${delay/1000}s... (${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
  }

  async downloadTemplate(templateName: string, projectName: string): Promise<void> {
    const templateUrl = `https://api.github.com/repos/${this.templatesRepo}/contents/${templateName}`;
    const projectPath = path.join(process.cwd(), projectName);

    // Ensure project directory exists
    await fs.ensureDir(projectPath);

    try {
      // Download template files recursively
      await this.downloadDirectoryWithProgress(templateUrl, projectPath);
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

  private async downloadDirectoryWithProgress(apiUrl: string, targetPath: string): Promise<void> {
    const headers = await this.authManager.getAuthHeaders();
    
    const response = await this.retryRequest(() => axios.get(apiUrl, { headers }));
    const items = response.data;
    
    console.log(`🔍 Found ${items.length} items in template`);
    items.forEach((item: any) => {
      console.log(`  ${item.type === 'dir' ? '📁' : '📄'} ${item.name}`);
    });
    
    // No filtering - copy everything
    const validItems = items;
    
    console.log(`📥 Will download ${validItems.length} items`);
    validItems.forEach((item: any) => {
      console.log(`  ✅ ${item.type === 'dir' ? '📁' : '📄'} ${item.name}`);
    });
    
    if (validItems.length === 0) {
      console.log('⚠️  No items to download');
      return;
    }

    // Create a simple progress indicator
    let downloadedCount = 0;
    const totalFiles = validItems.length;
    
    for (const item of validItems) {
      const itemPath = path.join(targetPath, item.name);

      if (item.type === 'file') {
        // Download file content with retry logic
        const headers = await this.authManager.getAuthHeaders();
        const fileResponse = await this.retryRequest(() => 
          axios.get(item.download_url, { 
            headers,
            responseType: 'arraybuffer' 
          })
        );
        await fs.writeFile(itemPath, fileResponse.data);
        downloadedCount++;
        
        // Update progress
        const progress = Math.round((downloadedCount / totalFiles) * 100);
        process.stdout.write(`\r📥 Downloading files... ${progress}% (${downloadedCount}/${totalFiles})`);
        
        // Increased delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      } else if (item.type === 'dir') {
        // Create directory and recursively download contents
        await fs.ensureDir(itemPath);
        await this.downloadDirectorySilent(item.url, itemPath);
      }
    }
    
    // Clear the progress line and show completion
    process.stdout.write('\r');
    console.log('✅ Template downloaded successfully');
  }

  private async downloadDirectorySilent(apiUrl: string, targetPath: string): Promise<void> {
    const headers = await this.authManager.getAuthHeaders();
    
    const response = await this.retryRequest(() => axios.get(apiUrl, { headers }));
    const items = response.data;

    for (const item of items) {
      const itemPath = path.join(targetPath, item.name);

      if (item.type === 'file') {
        // Download file content with retry logic
        const headers = await this.authManager.getAuthHeaders();
        const fileResponse = await this.retryRequest(() =>
          axios.get(item.download_url, { 
            headers,
            responseType: 'arraybuffer' 
          })
        );
        await fs.writeFile(itemPath, fileResponse.data);
        
        // Increased delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      } else if (item.type === 'dir') {
        // Create directory and recursively download contents
        await fs.ensureDir(itemPath);
        await this.downloadDirectorySilent(item.url, itemPath);
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

}