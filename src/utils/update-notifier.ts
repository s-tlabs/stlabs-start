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
          `\n⬆️  Nueva versión disponible: ${chalk.gray(CURRENT_VERSION)} → ${chalk.green(latest)}`
        )
      );

      const { shouldUpdate } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldUpdate',
          message: '¿Deseas actualizar ahora?',
          default: false,
        },
      ]);

      if (shouldUpdate) {
        console.log(chalk.blue('Actualizando...'));
        try {
          execSync('npm install -g stlabs-start@latest', { stdio: 'inherit' });
          console.log(chalk.green(`✅ Actualizado a v${latest}`));
          console.log(chalk.gray('Ejecuta el comando de nuevo para usar la nueva versión.'));
          process.exit(0);
        } catch (_updateError) {
          console.log(chalk.yellow('⚠️  No se pudo actualizar automáticamente.'));
          console.log(chalk.gray(`  Ejecuta manualmente: npm install -g stlabs-start@latest`));
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
