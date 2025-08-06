import chalk from 'chalk';
import ora from 'ora';
import { TemplateManager } from '../managers/template-manager';

export async function infoCommand(templateName: string): Promise<void> {
  if (!templateName) {
    console.error(chalk.red('❌ Template name is required'));
    console.log(chalk.gray('Usage: stlabs-start --info <template-name>'));
    return;
  }

  console.log(chalk.blue.bold(`ℹ️  Template Info: ${templateName}`));
  console.log();

  const spinner = ora('Loading template information...').start();
  const templateManager = new TemplateManager();

  try {
    // Get template metadata
    const templates = await templateManager.getAvailableTemplates();
    const template = templates.find(t => t.key === templateName);

    if (!template) {
      spinner.fail(`Template "${templateName}" not found`);
      console.log();
      console.log(chalk.yellow('💡 Available templates:'));
      templates.forEach(t => {
        console.log(chalk.gray(`  • ${t.key}`));
      });
      return;
    }

    // Get detailed configuration
    const config = await templateManager.getTemplateConfig(templateName);
    spinner.succeed(`Template information loaded`);
    console.log();

    // Display template information
    console.log(chalk.green.bold('📦 ' + template.name));
    console.log(chalk.gray(template.description));
    console.log();

    // Category and Stack
    console.log(chalk.cyan('🏷️  Category:'), chalk.white(template.category));
    if (template.stack && template.stack.length > 0) {
      console.log(chalk.cyan('⚡ Stack:'), template.stack.map(tech => chalk.blue(`[${tech}]`)).join(' '));
    }
    console.log();

    // Features
    if (template.features && template.features.length > 0) {
      console.log(chalk.cyan('✨ Features:'));
      template.features.forEach(feature => {
        console.log(chalk.gray(`  • ${feature}`));
      });
      console.log();
    }

    // Supported capabilities
    if (template.supports && template.supports.length > 0) {
      console.log(chalk.cyan('🔧 Supports:'));
      template.supports.forEach(support => {
        console.log(chalk.gray(`  • ${support}`));
      });
      console.log();
    }

    // Variables
    if (template.variables) {
      console.log(chalk.cyan('🔧 Configuration:'));
      
      if (template.variables.required && template.variables.required.length > 0) {
        console.log(chalk.red('  Required variables:'));
        template.variables.required.forEach(variable => {
          console.log(chalk.gray(`    • ${variable}`));
        });
      }

      if (template.variables.optional && template.variables.optional.length > 0) {
        console.log(chalk.yellow('  Optional variables:'));
        template.variables.optional.forEach(variable => {
          console.log(chalk.gray(`    • ${variable}`));
        });
      }

      if (template.variables.generated && template.variables.generated.length > 0) {
        console.log(chalk.green('  Auto-generated variables:'));
        template.variables.generated.forEach(variable => {
          console.log(chalk.gray(`    • ${variable}`));
        });
      }
      console.log();
    }

    // Configuration prompts
    if (config.prompts && config.prompts.length > 0) {
      console.log(chalk.cyan('❓ Configuration Prompts:'));
      config.prompts.forEach((prompt, index) => {
        const typeIcon = getPromptIcon(prompt.type);
        const required = prompt.validate ? chalk.red('*') : '';
        console.log(chalk.gray(`  ${index + 1}. ${typeIcon} ${prompt.message}${required}`));
        if (prompt.default) {
          console.log(chalk.gray(`     Default: ${prompt.default}`));
        }
      });
      console.log();
    }

    // Post-install commands
    if (template.postInstall && template.postInstall.length > 0) {
      console.log(chalk.cyan('🚀 Post-install commands:'));
      template.postInstall.forEach(command => {
        console.log(chalk.gray(`  $ ${command}`));
      });
      console.log();
    }

    // Usage example
    console.log(chalk.yellow('💡 Usage:'));
    console.log(chalk.gray(`  stlabs-start my-project ${templateName}`));
    console.log(chalk.gray(`  stlabs-start my-project ${templateName} --config config.json`));
    console.log();

  } catch (error) {
    spinner.fail('Failed to load template information');
    console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
    
    console.log();
    console.log(chalk.yellow('💡 Troubleshooting:'));
    console.log(chalk.gray('• Check your internet connection'));
    console.log(chalk.gray('• Verify GitHub authentication: stlabs-start auth --view'));
    console.log(chalk.gray('• Make sure the template name is correct'));
  }
}

function getPromptIcon(type: string): string {
  const icons: Record<string, string> = {
    input: '📝',
    password: '🔒',
    confirm: '❓',
    list: '📋',
    number: '🔢'
  };
  return icons[type] || '❓';
}