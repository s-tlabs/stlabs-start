import fs from 'fs-extra';
import path from 'path';
import Handlebars from 'handlebars';
import { promises as fsPromises } from 'fs';
import { AuthManager } from './auth-manager';
import axios from 'axios';

export class GitHubManager {
  private templatesRepo = 's-tlabs/boilerplates';
  private authManager = new AuthManager();

  async downloadTemplate(templateName: string, projectName: string): Promise<void> {
    const projectPath = path.join(process.cwd(), projectName);
    
    try {
      console.log(`🔍 Downloading template ${templateName}...`);
      
      // Get authentication headers
      const authHeaders = await this.authManager.getAuthHeaders();
      
      // Download template directory using GitHub API
      await this.downloadDirectoryFromGitHub(templateName, projectPath, authHeaders);
      
      console.log('✅ Template downloaded successfully');
    } catch (error) {
      console.error('❌ Failed to download template from GitHub');
      console.error('Error:', error instanceof Error ? error.message : String(error));
      console.log();
      console.log('💡 Troubleshooting tips:');
      console.log('• Verify the template exists in the repository');
      console.log('• Check GitHub authentication: stlabs-start auth --view');
      console.log('• Try a different template from the available list');
      
      throw new Error(`Template '${templateName}' not found or not accessible. Please check the repository and try again.`);
    }
  }

  private async downloadDirectoryFromGitHub(
    directoryPath: string, 
    targetPath: string, 
    authHeaders: any
  ): Promise<void> {
    // API URL for the directory contents
    const apiUrl = `https://api.github.com/repos/${this.templatesRepo}/contents/${directoryPath}`;
    
    // Configure axios with authentication
    const axiosConfig = {
      headers: {
        ...authHeaders,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'stlabs-start-cli'
      }
    };

    try {
      // Get directory contents
      const response = await axios.get(apiUrl, axiosConfig);
      const items = response.data;

      if (!Array.isArray(items)) {
        throw new Error(`'${directoryPath}' is not a directory`);
      }

      // Ensure target directory exists
      await fs.ensureDir(targetPath);
      
      console.log(`📁 Found ${items.length} items in ${directoryPath}`);

      // Download each item
      for (const item of items) {
        const itemPath = path.join(targetPath, item.name);
        
        if (item.type === 'file') {
          console.log(`📄 Downloading ${item.name}...`);
          await this.downloadFileFromGitHub(item.download_url, itemPath, axiosConfig);
        } else if (item.type === 'dir') {
          console.log(`📁 Processing directory ${item.name}...`);
          await this.downloadDirectoryFromGitHub(
            `${directoryPath}/${item.name}`, 
            itemPath, 
            authHeaders
          );
        }
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Template directory '${directoryPath}' not found in repository`);
      }
      throw error;
    }
  }

  private async downloadFileFromGitHub(
    downloadUrl: string, 
    targetPath: string, 
    axiosConfig: any
  ): Promise<void> {
    try {
      const response = await axios.get(downloadUrl, {
        ...axiosConfig,
        responseType: 'arraybuffer'
      });
      
      await fs.writeFile(targetPath, response.data);
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn(`⚠️  File not accessible: ${downloadUrl}`);
        return;
      }
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  async processTemplateFiles(projectPath: string, variables: Record<string, any>): Promise<void> {
    const projectDir = path.join(process.cwd(), projectPath);
    
    // Process all .hbs files
    await this.processDirectory(projectDir, variables);
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