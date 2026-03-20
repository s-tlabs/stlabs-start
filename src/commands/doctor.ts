import chalk from 'chalk';
import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { AuthManager } from '../managers/auth-manager';
import { TemplateManager } from '../managers/template-manager';

interface CheckResult {
  label: string;
  ok: boolean;
  detail: string;
}

export async function doctorCommand(): Promise<void> {
  console.log(chalk.blue.bold('🩺 STLabs Start - Doctor'));
  console.log(chalk.gray('Checking system health...\n'));

  const results: CheckResult[] = [];

  // 1. Node.js version check
  results.push(checkNodeVersion());

  // 2. GitHub authentication check
  results.push(await checkGitHubAuth());

  // 3. Cache status check
  results.push(await checkCacheStatus());

  // 4. Network connectivity check
  results.push(await checkNetworkConnectivity());

  // 5. Repository accessibility check
  results.push(await checkRepositoryAccess());

  // 6. Duplicate templates check
  results.push(await checkDuplicateTemplates());

  // Print results
  console.log(chalk.bold('\nResults:\n'));
  let allOk = true;
  for (const result of results) {
    const icon = result.ok ? chalk.green('✔') : chalk.red('✘');
    const label = result.ok ? chalk.green(result.label) : chalk.red(result.label);
    console.log(`  ${icon} ${label}`);
    console.log(`    ${chalk.gray(result.detail)}`);
    if (!result.ok) allOk = false;
  }

  console.log();
  if (allOk) {
    console.log(chalk.green.bold('All checks passed. Your environment is ready.'));
  } else {
    console.log(chalk.yellow.bold('Some checks failed. Review the details above.'));
  }
}

function checkNodeVersion(): CheckResult {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0], 10);
  const ok = major >= 16;
  return {
    label: 'Node.js version',
    ok,
    detail: ok
      ? `${version} (>= 16 required)`
      : `${version} - Node.js 16 or higher is required`
  };
}

async function checkGitHubAuth(): Promise<CheckResult> {
  try {
    const authManager = new AuthManager();
    const auth = await authManager.getGitHubAuth();
    const hasToken = !!auth.token;
    return {
      label: 'GitHub authentication',
      ok: hasToken,
      detail: hasToken
        ? 'Token configured'
        : 'No token found. Run "stlabs-start auth --setup" or set GITHUB_TOKEN env variable'
    };
  } catch (error) {
    return {
      label: 'GitHub authentication',
      ok: false,
      detail: 'Failed to check authentication status'
    };
  }
}

async function checkCacheStatus(): Promise<CheckResult> {
  const cacheDir = path.join(os.homedir(), '.stlabs-cache');
  const cacheFile = path.join(cacheDir, 'templates.json');

  try {
    const content = await fs.readFile(cacheFile, 'utf-8');
    const cached = JSON.parse(content);

    if (!cached.timestamp) {
      return {
        label: 'Template cache',
        ok: false,
        detail: 'Cache file exists but has no timestamp'
      };
    }

    const ageMs = Date.now() - cached.timestamp;
    const ageMinutes = Math.floor(ageMs / 60000);
    const ageHours = Math.floor(ageMinutes / 60);
    const fresh = ageMs < 3600000;

    const ageStr = ageHours > 0 ? `${ageHours}h ${ageMinutes % 60}m ago` : `${ageMinutes}m ago`;

    return {
      label: 'Template cache',
      ok: true,
      detail: `Valid cache found (last updated ${ageStr})${!fresh ? ' - cache is stale, will refresh on next use' : ''}`
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        label: 'Template cache',
        ok: false,
        detail: 'Cache file is corrupt. Run "stlabs-start -u" to refresh'
      };
    }
    return {
      label: 'Template cache',
      ok: true,
      detail: 'No cache file found (will be created on first use)'
    };
  }
}

async function checkNetworkConnectivity(): Promise<CheckResult> {
  try {
    await axios.get('https://api.github.com', {
      headers: { 'User-Agent': 'stlabs-start-cli' },
      timeout: 10000
    });
    return {
      label: 'Network connectivity',
      ok: true,
      detail: 'Successfully reached api.github.com'
    };
  } catch (error) {
    return {
      label: 'Network connectivity',
      ok: false,
      detail: 'Cannot reach api.github.com. Check your internet connection or proxy settings'
    };
  }
}

async function checkRepositoryAccess(): Promise<CheckResult> {
  try {
    const authManager = new AuthManager();
    const headers = await authManager.getAuthHeaders();
    const response = await axios.get('https://api.github.com/repos/s-tlabs/boilerplates', {
      headers,
      timeout: 10000
    });
    return {
      label: 'Repository access (s-tlabs/boilerplates)',
      ok: true,
      detail: `Repository accessible (${response.data.private ? 'private' : 'public'})`
    };
  } catch (error: any) {
    const status = error?.response?.status;
    let detail = 'Cannot access repository s-tlabs/boilerplates';
    if (status === 404) {
      detail += ' - repository not found or no access. Check authentication';
    } else if (status === 403) {
      detail += ' - access forbidden. Check your token permissions';
    }
    return {
      label: 'Repository access (s-tlabs/boilerplates)',
      ok: false,
      detail
    };
  }
}

async function checkDuplicateTemplates(): Promise<CheckResult> {
  try {
    const templateManager = new TemplateManager();
    const duplicates = await templateManager.checkDuplicateTemplates();

    if (duplicates.length > 0) {
      return {
        label: 'Template uniqueness',
        ok: false,
        detail: `Duplicate template keys found: ${duplicates.join(', ')}`
      };
    }

    return {
      label: 'Template uniqueness',
      ok: true,
      detail: 'All template keys are unique'
    };
  } catch (error) {
    return {
      label: 'Template uniqueness',
      ok: true,
      detail: 'Could not check (templates not loaded)'
    };
  }
}
