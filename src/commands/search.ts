import chalk from 'chalk';
import ora from 'ora';
import { TemplateManager } from '../managers/template-manager';

export async function searchCommand(keyword: string): Promise<void> {
  const spinner = ora(`Searching for "${keyword}"...`).start();
  const templateManager = new TemplateManager();

  try {
    const templates = await templateManager.getAvailableTemplates();
    spinner.stop();

    const query = keyword.toLowerCase();

    const results = templates.filter(t => {
      return (
        t.key.toLowerCase().includes(query) ||
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        t.stack.some(s => s.toLowerCase().includes(query)) ||
        t.features.some(f => f.toLowerCase().includes(query))
      );
    });

    if (results.length === 0) {
      console.log(chalk.yellow(`No templates found matching "${keyword}"`));
      console.log(chalk.gray('Try a different keyword or run stlabs-start --list to see all templates'));
      return;
    }

    console.log(chalk.blue.bold(`🔍 Found ${results.length} template${results.length === 1 ? '' : 's'} matching "${keyword}":\n`));

    for (const t of results) {
      const categoryIcon = getCategoryIcon(t.category);
      console.log(chalk.green(`  ${t.key}`) + chalk.gray(` [${categoryIcon} ${t.category}]`));
      console.log(chalk.gray(`    ${t.description}`));

      if (t.stack.length > 0) {
        const stackBadges = t.stack.map(tech => chalk.blue(`[${tech}]`)).join(' ');
        console.log(`    ${stackBadges}`);
      }
      console.log();
    }

    console.log(chalk.yellow('💡 Usage:'));
    console.log(chalk.gray('  stlabs-start my-project <template-name>'));
    console.log(chalk.gray('  stlabs-start --info <template-name>'));

  } catch (error) {
    spinner.fail('Failed to search templates');
    console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
  }
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    fullstack: '🚀',
    backend: '⚙️',
    frontend: '🎨',
    mobile: '📱',
    extension: '🧩',
    monorepo: '📦',
    tooling: '🛠️',
    bot: '🤖',
  };
  return icons[category] || '📦';
}
