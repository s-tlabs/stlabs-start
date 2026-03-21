import inquirer from 'inquirer';
import chalk from 'chalk';
import { AuthManager } from '../managers/auth-manager';

export async function authCommand(options?: {
  view?: boolean;
  setup?: boolean;
  clear?: boolean;
}): Promise<void> {
  const authManager = new AuthManager();

  // Handle direct options first
  if (options?.view) {
    await viewConfig(authManager);
    return;
  }

  if (options?.setup) {
    await setupToken(authManager);
    return;
  }

  if (options?.clear) {
    await clearAuth(authManager);
    return;
  }

  // Interactive mode if no options provided
  console.log(chalk.blue.bold('🔐 GitHub Authentication Setup'));
  console.log(chalk.yellow('To access private templates, you need to provide a GitHub token.'));
  console.log();

  const { method } = await inquirer.prompt([
    {
      type: 'list',
      name: 'method',
      message: 'How would you like to authenticate?',
      choices: [
        { name: '🔑 Set GitHub Token', value: 'token' },
        { name: '📄 View current config', value: 'view' },
        { name: '🗑️  Clear authentication', value: 'clear' },
      ],
    },
  ]);

  switch (method) {
    case 'token':
      await setupToken(authManager);
      break;
    case 'view':
      await viewConfig(authManager);
      break;
    case 'clear':
      await clearAuth(authManager);
      break;
  }
}

async function setupToken(authManager: AuthManager): Promise<void> {
  console.log();
  console.log(chalk.yellow('📝 GitHub Token Setup:'));
  console.log(chalk.gray('1. Go to https://github.com/settings/tokens'));
  console.log(chalk.gray('2. Generate a new token (classic)'));
  console.log(chalk.gray('3. Select scopes: repo (for private repositories)'));
  console.log(chalk.gray('4. Copy the token and paste it below'));
  console.log();

  const { token, username } = await inquirer.prompt([
    {
      type: 'password',
      name: 'token',
      message: '🔑 GitHub Token:',
      validate: (input: string) => {
        if (!input) {
          return 'Token is required';
        }
        if (!input.startsWith('ghp_') && !input.startsWith('github_pat_')) {
          return 'Token should start with ghp_ or github_pat_';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'username',
      message: '👤 GitHub Username (optional):',
    },
  ]);

  try {
    await authManager.saveGitHubAuth({ token, username: username || undefined });
    console.log(chalk.green('✅ Authentication saved successfully!'));
    console.log(chalk.gray('Token is stored in ~/.stlabs-config.json'));
  } catch (error) {
    console.error(
      chalk.red('❌ Failed to save authentication:'),
      error instanceof Error ? error.message : String(error)
    );
  }
}

async function viewConfig(authManager: AuthManager): Promise<void> {
  const auth = await authManager.getGitHubAuth();

  console.log();
  console.log(chalk.blue('📄 Current Configuration:'));

  if (auth.token) {
    console.log(chalk.green('✅ GitHub Token: ') + chalk.gray('***' + auth.token.slice(-4)));
    if (auth.username) {
      console.log(chalk.green('✅ Username: ') + auth.username);
    }
  } else {
    console.log(chalk.yellow('⚠️  No GitHub token configured'));
    console.log(chalk.gray('Run: stlabs-start auth --setup'));
  }

  // Also check environment variables
  const envToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (envToken) {
    console.log(chalk.green('✅ Environment Token: ') + chalk.gray('***' + envToken.slice(-4)));
  }
}

async function clearAuth(authManager: AuthManager): Promise<void> {
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: '🗑️  Are you sure you want to clear authentication?',
      default: false,
    },
  ]);

  if (confirm) {
    try {
      await authManager.saveGitHubAuth({});
      console.log(chalk.green('✅ Authentication cleared successfully!'));
    } catch (error) {
      console.error(
        chalk.red('❌ Failed to clear authentication:'),
        error instanceof Error ? error.message : String(error)
      );
    }
  } else {
    console.log(chalk.gray('Operation cancelled.'));
  }
}
