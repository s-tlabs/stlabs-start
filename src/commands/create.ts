import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { TemplateManager } from '../managers/template-manager';
import { ConfigManager } from '../managers/config-manager';
import { GitHubManager } from '../managers/github-manager';

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

  const templateManager = new TemplateManager();
  const configManager = new ConfigManager();
  const githubManager = new GitHubManager();

  try {
    // Step 1: Get basic project information
    const basicInfo = await getBasicInfo(projectName);
    
    // Step 2: Select template
    const selectedTemplate = await selectTemplate(templateManager, templateName);
    
    // Step 3: Configure template variables
    const templateConfig = await configureTemplate(templateManager, selectedTemplate, basicInfo);
    
    // Step 4: Generate project
    await generateProject(githubManager, selectedTemplate, templateConfig);
    
    console.log();
    console.log(chalk.green.bold('✅ Project created successfully!'));
    console.log(chalk.yellow('📁 Next steps:'));
    console.log(chalk.yellow(`   cd ${basicInfo.projectName}`));
    console.log(chalk.yellow('   npm install'));
    console.log(chalk.yellow('   npm run dev'));
    
  } catch (error) {
    throw error;
  }
}

async function getBasicInfo(projectName?: string) {
  const questions = [];

  if (!projectName) {
    questions.push({
      type: 'input',
      name: 'projectName',
      message: '📦 Project name:',
      validate: (input: string) => {
        if (!input) return 'Project name is required';
        if (!/^[a-z][a-z0-9-]*$/.test(input)) {
          return 'Project name must start with a letter and contain only lowercase letters, numbers, and hyphens';
        }
        return true;
      }
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
      validate: (input: string) => input ? true : 'Author name is required'
    },
    {
      type: 'input',
      name: 'authorEmail',
      message: '📧 Your email:',
      validate: (input: string) => {
        if (!input) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) {
          return 'Please enter a valid email address';
        }
        return true;
      }
    }
  );

  const answers = await inquirer.prompt(questions);
  return {
    projectName: projectName || answers.projectName,
    projectDescription: answers.projectDescription || '',
    authorName: answers.authorName,
    authorEmail: answers.authorEmail
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
          value: 'fullstack' 
        },
        { 
          name: '⚙️  Backend - API y servicios', 
          value: 'backend' 
        },
        { 
          name: '🎨 Frontend - Interfaz de usuario', 
          value: 'frontend' 
        }
      ]
    }
  ]);

  // Step 2: Filter templates by category
  const filteredTemplates = templates.filter(template => template.category === category);

  if (filteredTemplates.length === 0) {
    throw new Error(`No templates available for category "${category}"`);
  }

  // Step 3: Show filtered templates
  const { selectedTemplate } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedTemplate',
      message: `📋 Templates disponibles para ${category}:`,
      choices: filteredTemplates.map(template => ({
        name: `${template.name} - ${template.description}`,
        value: template.key,
        short: template.name
      }))
    }
  ]);

  return selectedTemplate;
}

async function configureTemplate(
  templateManager: TemplateManager,
  templateName: string,
  basicInfo: any
) {
  const spinner = ora('Loading template configuration...').start();
  const templateConfig = await templateManager.getTemplateConfig(templateName);
  spinner.stop();

  if (!templateConfig.prompts || templateConfig.prompts.length === 0) {
    return { ...basicInfo };
  }

  console.log(chalk.blue(`\n⚙️  Configuring ${templateConfig.name}...`));
  
  // Filter out prompts that ask for info we already have
  const filteredPrompts = templateConfig.prompts.filter(prompt => {
    return !basicInfo.hasOwnProperty(prompt.name);
  });
  
  let answers = {};
  
  if (filteredPrompts.length > 0) {
    try {
      // Validate prompt structure
      const validPrompts = filteredPrompts.filter(prompt => {
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
        } catch (error) {
          console.error(chalk.yellow('⚠️  Error in conditional prompts'));
        }
      }
    }
  }

  return {
    ...basicInfo,
    ...answers,
    ...templateConfig.generatedVars
  };
}

async function generateProject(
  githubManager: GitHubManager,
  templateName: string,
  config: any
) {
  const spinner = ora('Downloading template...').start();
  
  try {
    // Download template from GitHub
    await githubManager.downloadTemplate(templateName, config.projectName);
    spinner.text = 'Processing template files...';
    
    // Process template files with variables
    await githubManager.processTemplateFiles(config.projectName, config);
    
    spinner.succeed('Project generated successfully');
  } catch (error) {
    spinner.fail('Failed to generate project');
    throw error;
  }
}