import { execSync } from 'child_process';
import chalk from 'chalk';
import inquirer from 'inquirer';

const CURRENT_VERSION = require('../../package.json').version;

/**
 * Show current version and check for updates.
 * If a newer version exists, offer to update automatically.
 */
export async function checkForUpdates(): Promise<void> {
  console.log(chalk.gray(`v${CURRENT_VERSION}`));

  try {
    const latest = execSync('npm view stlabs-start version', {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 5000,
    })
      .toString()
      .trim();

    if (latest && latest !== CURRENT_VERSION && isNewer(latest, CURRENT_VERSION)) {
      console.log(
        chalk.yellow(
          `\n⬆️  New version available: ${chalk.gray(CURRENT_VERSION)} → ${chalk.green(latest)}`
        )
      );

      const { shouldUpdate } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldUpdate',
          message: 'Do you want to update now?',
          default: false,
        },
      ]);

      if (shouldUpdate) {
        console.log(chalk.blue('Updating...'));
        try {
          execSync('npm install -g stlabs-start@latest', { stdio: 'inherit' });
          console.log(chalk.green(`✅ Updated to v${latest}`));
          console.log(chalk.gray('Run the command again to use the new version.'));
          process.exit(0);
        } catch (_updateError) {
          console.log(chalk.yellow('⚠️  Could not update automatically.'));
          console.log(chalk.gray(`  Run manually: npm install -g stlabs-start@latest`));
        }
      }
      console.log();
    }
  } catch {
    // Silently ignore - no network, npm not available, etc.
  }
}

function isNewer(latest: string, current: string): boolean {
  const a = latest.split('.').map(Number);
  const b = current.split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const av = a[i] || 0;
    const bv = b[i] || 0;
    if (av > bv) {
      return true;
    }
    if (av < bv) {
      return false;
    }
  }
  return false;
}
