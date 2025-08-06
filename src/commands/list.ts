import chalk from 'chalk';
import ora from 'ora';
import { TemplateManager } from '../managers/template-manager';

export async function listCommand(): Promise<void> {
  console.log(chalk.blue.bold('📋 Available Templates'));
  console.log();

  const spinner = ora('Loading templates...').start();
  const templateManager = new TemplateManager();

  try {
    const templates = await templateManager.getAvailableTemplates();
    spinner.stop();

    if (templates.length === 0) {
      console.log(chalk.yellow('⚠️  No templates found.'));
      console.log(chalk.gray('Make sure you have access to the templates repository.'));
      return;
    }

    // Group templates by category
    const categories = templates.reduce((acc, template) => {
      const category = template.category || 'other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(template);
      return acc;
    }, {} as Record<string, typeof templates>);

    // Display templates by category
    Object.entries(categories).forEach(([category, categoryTemplates]) => {
      const categoryIcon = getCategoryIcon(category);
      console.log(chalk.cyan.bold(`${categoryIcon} ${category.toUpperCase()}`));
      console.log();

      categoryTemplates.forEach(template => {
        console.log(chalk.green(`  ${template.key}`));
        console.log(chalk.gray(`    ${template.description}`));
        
        // Show stack
        if (template.stack && template.stack.length > 0) {
          const stackBadges = template.stack.map(tech => chalk.blue(`[${tech}]`)).join(' ');
          console.log(`    ${stackBadges}`);
        }

        // Show features
        if (template.features && template.features.length > 0) {
          const featuresList = template.features.slice(0, 3).join(', ');
          const moreFeatures = template.features.length > 3 ? ` +${template.features.length - 3} more` : '';
          console.log(chalk.gray(`    Features: ${featuresList}${moreFeatures}`));
        }

        console.log();
      });
    });

    console.log(chalk.yellow('💡 Usage:'));
    console.log(chalk.gray('  stlabs-start my-project <template-name>'));
    console.log(chalk.gray('  stlabs-start --info <template-name>'));
    console.log();

  } catch (error) {
    spinner.fail('Failed to load templates');
    console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
    
    console.log();
    console.log(chalk.yellow('💡 Troubleshooting:'));
    console.log(chalk.gray('• Check your internet connection'));
    console.log(chalk.gray('• Verify GitHub authentication: stlabs-start auth --view'));
    console.log(chalk.gray('• Make sure you have access to the templates repository'));
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