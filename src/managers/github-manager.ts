import fs from 'fs-extra';
import path from 'path';
import Handlebars from 'handlebars';
import { promises as fsPromises } from 'fs';
import { AuthManager } from './auth-manager';
const download = require('download-git-repo');

export class GitHubManager {
  private templatesRepo = 's-tlabs/boilerplates';
  private authManager = new AuthManager();

  async downloadTemplate(templateName: string, projectName: string): Promise<void> {
    const projectPath = path.join(process.cwd(), projectName);
    const tempPath = path.join(process.cwd(), '.temp-' + Date.now());
    
    try {
      console.log(`🔍 Downloading template ${templateName}...`);
      
      // Get authentication for private repository access
      const authHeaders = await this.authManager.getAuthHeaders();
      const token = authHeaders.Authorization?.replace('token ', '');
      
      // Construct the repository URL with authentication
      const repoUrl = token 
        ? `github:${this.templatesRepo}#main`
        : `${this.templatesRepo}#main`;
      
      // Download entire repository to temp directory
      await new Promise((resolve, reject) => {
        const options = token ? { 
          clone: false,
          headers: {
            'Authorization': `token ${token}`,
            'User-Agent': 'stlabs-start'
          }
        } : { clone: false };
        
        download(repoUrl, tempPath, options, (err: any) => {
          if (err) reject(err);
          else resolve(undefined);
        });
      });
      
      // Check if the specific template subdirectory exists
      const templateSourcePath = path.join(tempPath, templateName);
      
      if (!(await fs.pathExists(templateSourcePath))) {
        await fs.remove(tempPath);
        throw new Error(`Template directory '${templateName}' not found in repository`);
      }
      
      // Copy the specific template directory to the project path
      await fs.ensureDir(projectPath);
      await fs.copy(templateSourcePath, projectPath);
      
      // Clean up temp directory
      await fs.remove(tempPath);
      
      console.log('✅ Template downloaded successfully');
    } catch (error) {
      // Clean up temp directory on error
      try {
        await fs.remove(tempPath);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
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