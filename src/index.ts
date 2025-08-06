#!/usr/bin/env node

import { Command } from 'commander';
import { createCommand } from './commands/create';
import { authCommand } from './commands/auth';
import { listCommand } from './commands/list';
import { infoCommand } from './commands/info';
import { updateCommand } from './commands/update';
import chalk from 'chalk';

const program = new Command();

program
  .name('stlabs-start')
  .description('CLI tool for generating projects with predefined boilerplates')
  .version('1.0.0');

// Main create command
program
  .argument('[project-name]', 'Name of the project to create')
  .argument('[template]', 'Template to use')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('-l, --list', 'List available templates')
  .option('-i, --info <template>', 'Show template information')
  .option('-u, --update', 'Update templates cache')
  .action(async (projectName, template, options) => {
    try {
      if (options.list) {
        await listCommand();
        return;
      }

      if (options.info) {
        await infoCommand(options.info);
        return;
      }

      if (options.update) {
        await updateCommand();
        return;
      }

      await createCommand(projectName, template, options);
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Auth command
program
  .command('auth')
  .description('Configure GitHub authentication for private repositories')
  .option('--setup', 'Setup GitHub token')
  .option('--view', 'View current configuration')
  .option('--clear', 'Clear authentication')
  .action(async (options) => {
    try {
      await authCommand(options);
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse();