import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export interface GitHubAuth {
  token?: string;
  username?: string;
}

export class AuthManager {
  private configPath = path.join(os.homedir(), '.stlabs-config.json');

  async getGitHubAuth(): Promise<GitHubAuth> {
    try {
      // First, try environment variables
      const envToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
      if (envToken) {
        return { token: envToken };
      }

      // Then, try config file
      const config = await this.loadConfig();
      if (config.github?.token) {
        return config.github;
      }

      // No auth found
      return {};
    } catch (error) {
      return {};
    }
  }

  async saveGitHubAuth(auth: GitHubAuth): Promise<void> {
    try {
      const config = await this.loadConfig();
      config.github = auth;
      await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      throw new Error(`Failed to save GitHub authentication: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async loadConfig(): Promise<any> {
    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      // Config file doesn't exist, return empty config
      return {};
    }
  }

  async getAuthHeaders(): Promise<Record<string, string>> {
    // First, try environment variables
    const envToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    if (envToken) {
      return {
        'Authorization': `token ${envToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'stlabs-start-cli'
      };
    }

    // Then, try config file
    const auth = await this.getGitHubAuth();
    if (auth.token) {
      return {
        'Authorization': `token ${auth.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'stlabs-start-cli'
      };
    }

    return {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'stlabs-start-cli'
    };
  }
}