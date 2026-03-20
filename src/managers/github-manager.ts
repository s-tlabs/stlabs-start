import fs from 'fs-extra';
import path from 'path';
import Handlebars from 'handlebars';
import { promises as fsPromises } from 'fs';
import { AuthManager } from './auth-manager';
import axios from 'axios';
const tar = require('tar');

export class GitHubManager {
  private templatesRepo = 's-tlabs/boilerplates';
  private authManager = new AuthManager();

  async downloadTemplate(templateName: string, projectName: string, variant?: string): Promise<void> {
    const projectPath = path.join(process.cwd(), projectName);
    const tempPath = path.join(process.cwd(), '.temp-' + Date.now());

    try {
      console.log(`🔍 Downloading repository archive...`);

      // Get authentication headers
      const authHeaders = await this.authManager.getAuthHeaders();

      // Download entire repository as tarball (single request!)
      await this.downloadRepositoryArchive(tempPath, authHeaders);

      const sourcePath = variant ? `${templateName}/${variant}` : templateName;
      console.log(`📁 Extracting template ${sourcePath}...`);

      // Extract specific template directory from the archive
      await this.extractTemplateFromArchive(tempPath, sourcePath, projectPath);

      // Clean up temp files
      await fs.remove(tempPath);

      console.log('✅ Template downloaded successfully');
    } catch (error) {
      // Clean up on error
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

  private async downloadRepositoryArchive(tempPath: string, authHeaders: any): Promise<void> {
    // Use GitHub's tarball API endpoint - only 1 request!
    const archiveUrl = `https://api.github.com/repos/${this.templatesRepo}/tarball/main`;
    
    const response = await axios.get(archiveUrl, {
      headers: {
        ...authHeaders,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'stlabs-start-cli'
      },
      responseType: 'stream',
      maxRedirects: 5 // GitHub returns 302 redirect to actual download URL
    });

    // Save the tarball to temp file
    const archivePath = `${tempPath}.tar.gz`;
    const writer = fs.createWriteStream(archivePath);
    
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }

  private async extractTemplateFromArchive(
    tempPath: string, 
    templateName: string, 
    projectPath: string
  ): Promise<void> {
    const archivePath = `${tempPath}.tar.gz`;
    const extractPath = `${tempPath}-extracted`;
    
    // Ensure extract directory exists
    await fs.ensureDir(extractPath);
    
    // Extract the entire tarball
    await tar.x({
      file: archivePath,
      cwd: extractPath,
      strip: 1 // Remove the top-level directory (repo name)
    });

    // Find the extracted repository directory (GitHub creates a folder with repo-hash format)
    const extractedDirs = await fs.readdir(extractPath);
    if (extractedDirs.length === 0) {
      throw new Error('No content found in the downloaded archive');
    }

    // Look for the template directory
    const templateSourcePath = path.join(extractPath, templateName);
    
    if (!(await fs.pathExists(templateSourcePath))) {
      throw new Error(`Template directory '${templateName}' not found in repository`);
    }

    // Copy the template directory to the project path
    await fs.ensureDir(projectPath);
    await fs.copy(templateSourcePath, projectPath);
    
    // Clean up extracted files
    await fs.remove(extractPath);
    await fs.remove(archivePath);
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