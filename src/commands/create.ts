import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import { TemplateManager } from '../managers/template-manager';
import { GitHubManager } from '../managers/github-manager';
import { RequirementsChecker } from '../managers/requirements-checker';
import { validators } from '../utils/validators';
import {
  startPromptTimeout,
  resetPromptTimeout,
  clearPromptTimeout,
} from '../utils/prompt-timeout';

export interface CreateOptions {
  config?: string;
}

export async function createCommand(
  projectName?: string,
  templateName?: string,
  options: CreateOptions = {}
): Promise<void> {
  console.log(chalk.blue.bold('🚀 ¡Bienvenido a STLabs Start!'));
  console.log(chalk.gray('Generador de proyectos con templates predefinidos'));
  console.log();

  // Start inactivity timeout
  startPromptTimeout();

  const templateManager = new TemplateManager();
  const githubManager = new GitHubManager();

  try {
    // Step 0: Load and validate config file if provided
    let configData: Record<string, any> = {};
    if (options.config) {
      configData = loadConfigFile(options.config);
      // Use projectName from config if not provided via CLI
      if (!projectName && configData.projectName) {
        projectName = configData.projectName;
      }
    }

    // Step 1: Get basic project information
    const basicInfo = await getBasicInfo(projectName);

    // Merge config file data into basicInfo
    const mergedInfo = { ...basicInfo, ...configData, projectName: basicInfo.projectName };

    // Step 1.5: Check if directory already exists
    const projectDir = path.join(process.cwd(), mergedInfo.projectName);
    if (await fs.pathExists(projectDir)) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `⚠️  Directory "${mergedInfo.projectName}" already exists. Do you want to overwrite it?`,
          default: false,
        },
      ]);

      if (!overwrite) {
        console.log(chalk.yellow('Aborted. Directory was not modified.'));
        return;
      }

      await fs.remove(projectDir);
      console.log(chalk.gray(`Removed existing directory "${mergedInfo.projectName}"`));
    }

    // Step 2: Select template
    const selectedTemplate = await selectTemplate(templateManager, templateName);

    // Handle back option from template selection
    if (!selectedTemplate) {
      return;
    }

    // Step 2.5: Select variant if template has variants
    const selectedVariant = await selectVariant(templateManager, selectedTemplate);

    // Step 2.6: Check system requirements
    const templates = await templateManager.getAvailableTemplates();
    const templateData = templates.find((t) => t.key === selectedTemplate);
    await checkRequirements(templateData);

    // Step 2.7: Select package manager (for Node.js templates)
    const isNodeTemplate = templateData?.variables?.optional?.includes('packageManager');
    const packageManager = isNodeTemplate ? await selectPackageManager() : undefined;

    // Step 3: Configure template variables
    const templateConfig = await configureTemplate(
      templateManager,
      selectedTemplate,
      { ...mergedInfo, ...(packageManager ? { packageManager } : {}) },
      selectedVariant
    );

    // Step 4: Generate project
    await generateProject(githubManager, selectedTemplate, templateConfig, selectedVariant);

    const pm = packageManager || 'npm';
    console.log();
    console.log(chalk.green.bold('✅ Project created successfully!'));

    // Step 5: Ask to auto-install dependencies
    const { autoInstall } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'autoInstall',
        message: `📦 Do you want to install dependencies with ${pm}?`,
        default: true,
      },
    ]);

    if (autoInstall) {
      const installSpinner = ora(`Installing dependencies with ${pm}...`).start();
      try {
        execSync(`${pm} install`, { stdio: 'inherit', cwd: projectDir });
        installSpinner.succeed('Dependencies installed successfully');
      } catch (_installError) {
        installSpinner.fail('Failed to install dependencies');
        console.log(
          chalk.yellow(
            `💡 You can install them manually: cd ${mergedInfo.projectName} && ${pm} install`
          )
        );
      }
    }

    // Step 6: Run postInstall commands
    if (templateData?.postInstall && templateData.postInstall.length > 0) {
      // Filter out the base install command (already handled above)
      const postCommands = templateData.postInstall.filter(
        (cmd: string) => !cmd.match(/^(npm|pnpm|yarn|bun)\s+install$/)
      );

      if (postCommands.length > 0) {
        console.log(chalk.blue('\n⚙️  Running post-install commands...'));
        for (const cmd of postCommands) {
          const cmdSpinner = ora(`Running: ${cmd}`).start();
          try {
            execSync(cmd, { stdio: 'pipe', cwd: projectDir });
            cmdSpinner.succeed(`Done: ${cmd}`);
          } catch (_cmdError) {
            cmdSpinner.warn(`Failed: ${cmd}`);
            console.log(
              chalk.gray(`  You can run it manually later: cd ${mergedInfo.projectName} && ${cmd}`)
            );
          }
        }
      }
    }

    // Step 7: Initialize git repository
    try {
      execSync('git init', { stdio: 'pipe', cwd: projectDir });
      execSync('git add -A', { stdio: 'pipe', cwd: projectDir });
      execSync('git commit -m "Initial commit from stlabs-start"', {
        stdio: 'pipe',
        cwd: projectDir,
      });
      console.log(chalk.gray('\n📦 Git repository initialized with initial commit'));
    } catch (_gitError) {
      // git not available or failed - not critical
    }

    console.log(chalk.yellow('\n📁 Next steps:'));
    console.log(chalk.yellow(`   cd ${mergedInfo.projectName}`));
    if (!autoInstall) {
      console.log(chalk.yellow(`   ${pm} install`));
    }
    console.log(chalk.yellow(`   ${pm} run dev`));

    clearPromptTimeout();
  } catch (error) {
    clearPromptTimeout();
    throw error;
  }
}

function loadConfigFile(configPath: string): Record<string, any> {
  const resolvedPath = path.resolve(configPath);

  if (!fs.pathExistsSync(resolvedPath)) {
    throw new Error(`Config file not found: ${resolvedPath}`);
  }

  let content: string;
  try {
    content = fs.readFileSync(resolvedPath, 'utf-8');
  } catch (_error) {
    throw new Error(`Failed to read config file: ${resolvedPath}`);
  }

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch (_error) {
    throw new Error(`Config file is not valid JSON: ${resolvedPath}`);
  }

  if (!parsed.projectName || typeof parsed.projectName !== 'string') {
    throw new Error('Config file must contain a "projectName" field (string)');
  }

  return parsed;
}

async function getBasicInfo(projectName?: string) {
  const questions = [];

  if (!projectName) {
    questions.push({
      type: 'input',
      name: 'projectName',
      message: '📦 Project name:',
      validate: validators.projectName,
    });
  }

  questions.push(
    {
      type: 'input',
      name: 'projectDescription',
      message: '📝 Project description (optional):',
    },
    {
      type: 'input',
      name: 'authorName',
      message: '👤 Your name:',
      validate: validators.required,
    },
    {
      type: 'input',
      name: 'authorEmail',
      message: '📧 Your email:',
      validate: validators.email,
    }
  );

  const answers = await inquirer.prompt(questions);
  resetPromptTimeout();
  return {
    projectName: projectName || answers.projectName,
    projectDescription: answers.projectDescription || '',
    authorName: answers.authorName,
    authorEmail: answers.authorEmail,
  };
}

async function selectTemplate(templateManager: TemplateManager, templateName?: string) {
  if (templateName) {
    const isValid = await templateManager.validateTemplate(templateName);
    if (!isValid) {
      throw new Error(`Template "${templateName}" not found`);
    }
    return templateName;
  }

  const spinner = ora('Loading available templates...').start();
  const templates = await templateManager.getAvailableTemplates();
  spinner.stop();

  // Step 1: Ask for project category
  const { category } = await inquirer.prompt([
    {
      type: 'list',
      name: 'category',
      message: '🎯 ¿Qué tipo de proyecto quieres crear?',
      choices: [
        {
          name: '🚀 Fullstack - Aplicación completa (frontend + backend)',
          value: 'fullstack',
        },
        {
          name: '⚙️  Backend - API y servicios',
          value: 'backend',
        },
        {
          name: '🎨 Frontend - Interfaz de usuario',
          value: 'frontend',
        },
        {
          name: '📱 Mobile - Aplicaciones móviles',
          value: 'mobile',
        },
        {
          name: '🧩 Extension - Extensiones de navegador',
          value: 'extension',
        },
        {
          name: '📦 Monorepo - Proyecto multi-paquete',
          value: 'monorepo',
        },
        {
          name: '🛠️  Tooling - Herramientas CLI y utilidades',
          value: 'tooling',
        },
        {
          name: '🤖 Bot - Bots y automatizaciones',
          value: 'bot',
        },
        {
          name: '⬅️  Volver atrás',
          value: 'back',
        },
      ],
    },
  ]);

  // Handle back option
  if (category === 'back') {
    console.log(chalk.yellow('👋 ¡Hasta luego!'));
    return;
  }

  // Step 2: Filter templates by category
  const filteredTemplates = templates.filter((template) => template.category === category);

  if (filteredTemplates.length === 0) {
    console.log(chalk.red(`❌ No hay templates disponibles para la categoría "${category}"`));
    console.log(chalk.yellow('💡 Intenta con otra categoría o verifica la conexión a internet.'));

    // Ask if user wants to go back
    const { goBack } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'goBack',
        message: '¿Quieres volver a seleccionar categoría?',
        default: true,
      },
    ]);

    if (goBack) {
      return await selectTemplate(templateManager, templateName);
    } else {
      console.log(chalk.yellow('👋 ¡Hasta luego!'));
      return;
    }
  }

  // Step 3: Show filtered templates
  const { selectedTemplate } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedTemplate',
      message: `📋 Templates disponibles para ${category}:`,
      choices: [
        ...filteredTemplates.map((template) => ({
          name: `${template.name} - ${template.description}`,
          value: template.key,
          short: template.name,
        })),
        {
          name: '⬅️  Volver a seleccionar categoría',
          value: 'back',
        },
      ],
    },
  ]);

  // Handle back option
  if (selectedTemplate === 'back') {
    return await selectTemplate(templateManager, templateName);
  }

  return selectedTemplate;
}

async function selectPackageManager(): Promise<string> {
  const { pm } = await inquirer.prompt([
    {
      type: 'list',
      name: 'pm',
      message: '📦 Package manager:',
      choices: [
        { name: 'npm', value: 'npm' },
        { name: 'pnpm', value: 'pnpm' },
        { name: 'yarn', value: 'yarn' },
        { name: 'bun', value: 'bun' },
      ],
      default: 'npm',
    },
  ]);
  return pm;
}

async function selectVariant(
  templateManager: TemplateManager,
  templateName: string
): Promise<string | undefined> {
  const templates = await templateManager.getAvailableTemplates();
  const template = templates.find((t) => t.key === templateName);

  if (!template?.variants || Object.keys(template.variants).length === 0) {
    return undefined;
  }

  const { selectedVariant } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedVariant',
      message: '🔧 Selecciona una variante:',
      choices: Object.entries(template.variants).map(([key, variant]) => ({
        name: `${variant.name} - ${variant.description}`,
        value: key,
        short: variant.name,
      })),
    },
  ]);

  return selectedVariant;
}

async function configureTemplate(
  templateManager: TemplateManager,
  templateName: string,
  basicInfo: any,
  variant?: string
) {
  const spinner = ora('Loading template configuration...').start();
  const configPath = variant ? `${templateName}/${variant}` : templateName;
  const templateConfig = await templateManager.getTemplateConfig(configPath);
  spinner.stop();

  if (!templateConfig.prompts || templateConfig.prompts.length === 0) {
    return { ...basicInfo };
  }

  console.log(chalk.blue(`\n⚙️  Configuring ${templateConfig.name}...`));

  // Add option to go back to template selection
  const { continueConfig } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'continueConfig',
      message: '¿Continuar con la configuración del template?',
      default: true,
    },
  ]);

  if (!continueConfig) {
    console.log(chalk.yellow('👋 ¡Hasta luego!'));
    return;
  }

  // Filter out prompts that ask for info we already have
  const filteredPrompts = templateConfig.prompts.filter((prompt) => {
    return !basicInfo.hasOwnProperty(prompt.name);
  });

  let answers = {};

  if (filteredPrompts.length > 0) {
    try {
      // Validate prompt structure
      const validPrompts = filteredPrompts.filter((prompt) => {
        return prompt && typeof prompt === 'object' && prompt.name && prompt.message;
      });

      if (validPrompts.length > 0) {
        answers = await inquirer.prompt(validPrompts);
      }
    } catch (error) {
      console.error(chalk.yellow('⚠️  Error in template prompts, using defaults'));
      console.error(chalk.gray('Error:', error instanceof Error ? error.message : String(error)));
    }
  }

  // Handle conditional prompts
  if (templateConfig.conditionalPrompts) {
    for (const [condition, prompts] of Object.entries(templateConfig.conditionalPrompts)) {
      if ((answers as any)[condition]) {
        try {
          const conditionalAnswers = await inquirer.prompt(prompts);
          Object.assign(answers, conditionalAnswers);
        } catch (_error) {
          console.error(chalk.yellow('⚠️  Error in conditional prompts'));
        }
      }
    }
  }

  return {
    ...basicInfo,
    ...answers,
    ...templateConfig.generatedVars,
  };
}

async function generateProject(
  githubManager: GitHubManager,
  templateName: string,
  config: any,
  variant?: string
) {
  const spinner = ora('Downloading template...').start();
  const projectDir = path.join(process.cwd(), config.projectName);

  try {
    // Download template from GitHub
    await githubManager.downloadTemplate(templateName, config.projectName, variant);
    spinner.text = 'Processing template files...';

    // Process template files with variables
    await githubManager.processTemplateFiles(config.projectName, config);

    spinner.succeed('Project generated successfully');
  } catch (error) {
    spinner.fail('Failed to generate project');

    // Rollback: clean up partially created project directory
    try {
      if (await fs.pathExists(projectDir)) {
        await fs.remove(projectDir);
        console.log(chalk.gray('Cleaned up partial project directory'));
      }
    } catch (_cleanupError) {
      // Ignore cleanup errors
    }

    throw error;
  }
}

async function checkRequirements(templateData: any): Promise<void> {
  const requirements: string[] = templateData?.requirements || [];
  const optionalReqs: string[] = templateData?.optionalRequirements || [];

  if (requirements.length === 0 && optionalReqs.length === 0) {
    return;
  }

  console.log(chalk.blue('\n🔍 Checking system requirements...\n'));

  const checker = new RequirementsChecker();
  const results = await checker.check(requirements, optionalReqs);
  const allOk = checker.printResults(results);

  console.log();

  if (!allOk) {
    const missing = results.filter((r) => r.required && !r.installed);
    console.log(
      chalk.red(
        `❌ Missing ${missing.length} required dependenc${missing.length === 1 ? 'y' : 'ies'}: ${missing.map((r) => r.name).join(', ')}`
      )
    );
    console.log();

    const { continueAnyway } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continueAnyway',
        message:
          '¿Quieres continuar de todas formas? El proyecto podría no funcionar correctamente.',
        default: false,
      },
    ]);

    if (!continueAnyway) {
      console.log(chalk.yellow('Aborted. Install the missing dependencies and try again.'));
      process.exit(0);
    }
  } else {
    console.log(chalk.green('✅ All requirements satisfied'));
  }
}
