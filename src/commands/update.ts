import chalk from 'chalk';
import ora from 'ora';
import { promises as fs } from 'fs';
import path from 'path';
import { TemplateManager } from '../managers/template-manager';

export async function updateCommand(): Promise<void> {
  console.log(chalk.blue.bold('🔄 Updating Templates Cache'));
  console.log();

  const spinner = ora('Clearing local cache...').start();
  const templateManager = new TemplateManager();

  try {
    // Clear existing cache
    const cacheDir = path.join(process.cwd(), '.templates-cache');
    
    try {
      await fs.rm(cacheDir, { recursive: true, force: true });
      spinner.text = 'Fetching latest templates...';
    } catch (error) {
      // Cache directory doesn't exist, continue
      spinner.text = 'Fetching latest templates...';
    }

    // Force fetch from remote by requesting templates
    // This will automatically cache the new data
    const templates = await templateManager.getAvailableTemplates();
    
    spinner.succeed('Templates cache updated successfully');
    console.log();

    if (templates.length > 0) {
      console.log(chalk.green(`✅ Found ${templates.length} templates:`));
      templates.forEach(template => {
        const categoryIcon = getCategoryIcon(template.category);
        console.log(chalk.gray(`  ${categoryIcon} ${template.key} - ${template.name}`));
      });
    } else {
      console.log(chalk.yellow('⚠️  No templates found in the remote repository.'));
    }

    console.log();
    console.log(chalk.blue('💡 You can now use:'));
    console.log(chalk.gray('  stlabs-start --list'));
    console.log(chalk.gray('  stlabs-start my-project <template-name>'));

  } catch (error) {
    spinner.fail('Failed to update templates cache');
    console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
    
    console.log();
    console.log(chalk.yellow('💡 Troubleshooting:'));
    console.log(chalk.gray('• Check your internet connection'));
    console.log(chalk.gray('• Verify GitHub authentication: stlabs-start auth --view'));
    console.log(chalk.gray('• Make sure you have access to the templates repository'));
    console.log(chalk.gray('• Try running: stlabs-start auth'));
  }
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    fullstack: '🚀',
    backend: '⚙️',
    frontend: '🎨',
    mobile: '📱',
    other: '📦'
  };
  return icons[category] || icons.other;
}