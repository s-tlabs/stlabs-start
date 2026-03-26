import inquirer from 'inquirer';
import chalk from 'chalk';
import crypto from 'crypto';
import { validators } from '../utils/validators';

export interface DatabaseConfig {
  databaseUrl: string;
  dbMode: 'remote' | 'docker';
  dbEngine: string;
  dbHost: string;
  dbPort: number;
  dbUser: string;
  dbPassword: string;
  dbName: string;
  dbSsl: boolean;
  dockerCompose?: string;
}

interface DbEngineInfo {
  name: string;
  defaultPort: number;
  protocol: string;
  dockerImage: string;
  dockerPort: string;
  envVars: Record<string, string>;
}

const DB_ENGINES: Record<string, DbEngineInfo> = {
  postgresql: {
    name: 'PostgreSQL',
    defaultPort: 5432,
    protocol: 'postgresql',
    dockerImage: 'postgres:16-alpine',
    dockerPort: '5432:5432',
    envVars: {
      POSTGRES_USER: '{{user}}',
      POSTGRES_PASSWORD: '{{password}}',
      POSTGRES_DB: '{{dbName}}',
    },
  },
  mysql: {
    name: 'MySQL',
    defaultPort: 3306,
    protocol: 'mysql',
    dockerImage: 'mysql:8',
    dockerPort: '3306:3306',
    envVars: {
      MYSQL_ROOT_PASSWORD: '{{password}}',
      MYSQL_DATABASE: '{{dbName}}',
      MYSQL_USER: '{{user}}',
      MYSQL_PASSWORD: '{{password}}',
    },
  },
  mongodb: {
    name: 'MongoDB',
    defaultPort: 27017,
    protocol: 'mongodb',
    dockerImage: 'mongo:7',
    dockerPort: '27017:27017',
    envVars: {
      MONGO_INITDB_ROOT_USERNAME: '{{user}}',
      MONGO_INITDB_ROOT_PASSWORD: '{{password}}',
      MONGO_INITDB_DATABASE: '{{dbName}}',
    },
  },
  mariadb: {
    name: 'MariaDB',
    defaultPort: 3306,
    protocol: 'mysql',
    dockerImage: 'mariadb:11',
    dockerPort: '3306:3306',
    envVars: {
      MARIADB_ROOT_PASSWORD: '{{password}}',
      MARIADB_DATABASE: '{{dbName}}',
      MARIADB_USER: '{{user}}',
      MARIADB_PASSWORD: '{{password}}',
    },
  },
};

export class DatabaseManager {
  /**
   * Detect the database engine from a template's stack array.
   * Returns the engine key or null if no database is detected.
   */
  detectDatabase(stack: string[]): string | null {
    const stackLower = stack.map((s) => s.toLowerCase());

    for (const engine of Object.keys(DB_ENGINES)) {
      if (stackLower.includes(engine)) {
        return engine;
      }
    }

    // Check common aliases
    if (stackLower.includes('postgres')) {
      return 'postgresql';
    }
    if (stackLower.includes('mongo')) {
      return 'mongodb';
    }
    if (stackLower.includes('maria')) {
      return 'mariadb';
    }

    return null;
  }

  /**
   * Run the database configuration flow.
   * Returns database config variables to merge into the template config.
   */
  async configure(dbEngine: string, projectName: string): Promise<DatabaseConfig> {
    const engineInfo = DB_ENGINES[dbEngine];
    if (!engineInfo) {
      throw new Error(`Unknown database engine: ${dbEngine}`);
    }

    console.log(chalk.blue(`\n🗄️  Database Configuration (${engineInfo.name})\n`));

    const { dbMode } = await inquirer.prompt([
      {
        type: 'list',
        name: 'dbMode',
        message: 'How do you want to configure the database?',
        choices: [
          {
            name: '🌐 Remote database (provide connection details)',
            value: 'remote',
          },
          {
            name: '🐳 Local Docker container (auto-configure docker-compose)',
            value: 'docker',
          },
        ],
      },
    ]);

    if (dbMode === 'remote') {
      return this.configureRemote(dbEngine, engineInfo, projectName);
    } else {
      return this.configureDocker(dbEngine, engineInfo, projectName);
    }
  }

  private async configureRemote(
    dbEngine: string,
    engineInfo: DbEngineInfo,
    projectName: string
  ): Promise<DatabaseConfig> {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'dbHost',
        message: `🌐 ${engineInfo.name} host:`,
        validate: validators.required,
      },
      {
        type: 'number',
        name: 'dbPort',
        message: `🔌 Port:`,
        default: engineInfo.defaultPort,
      },
      {
        type: 'input',
        name: 'dbUser',
        message: '👤 Username:',
        validate: validators.required,
      },
      {
        type: 'password',
        name: 'dbPassword',
        message: '🔒 Password:',
        validate: validators.required,
      },
      {
        type: 'input',
        name: 'dbName',
        message: '📦 Database name:',
        default: projectName.replace(/[^a-zA-Z0-9]/g, '_'),
        validate: validators.required,
      },
      {
        type: 'confirm',
        name: 'dbSsl',
        message: '🔐 Use SSL/TLS?',
        default: true,
      },
    ]);

    const sslParam = this.getSslParam(dbEngine, answers.dbSsl);
    const databaseUrl = `${engineInfo.protocol}://${answers.dbUser}:${answers.dbPassword}@${answers.dbHost}:${answers.dbPort}/${answers.dbName}${sslParam}`;

    console.log(chalk.green('\n✅ Database URL configured'));
    console.log(chalk.gray(`   ${this.maskPassword(databaseUrl)}`));

    return {
      databaseUrl,
      dbMode: 'remote',
      dbEngine,
      dbHost: answers.dbHost,
      dbPort: answers.dbPort,
      dbUser: answers.dbUser,
      dbPassword: answers.dbPassword,
      dbName: answers.dbName,
      dbSsl: answers.dbSsl,
    };
  }

  private async configureDocker(
    dbEngine: string,
    engineInfo: DbEngineInfo,
    projectName: string
  ): Promise<DatabaseConfig> {
    const dbName = projectName.replace(/[^a-zA-Z0-9]/g, '_');
    const dbUser = dbEngine === 'mongodb' ? 'admin' : 'app_user';
    const dbPassword = crypto.randomBytes(16).toString('hex');
    const dbPort = engineInfo.defaultPort;

    const databaseUrl = `${engineInfo.protocol}://${dbUser}:${dbPassword}@localhost:${dbPort}/${dbName}`;

    const dockerCompose = this.generateDockerCompose(dbEngine, engineInfo, {
      dbName,
      dbUser,
      dbPassword,
    });

    console.log(chalk.green('\n✅ Docker configuration generated'));
    console.log(chalk.gray(`   Image: ${engineInfo.dockerImage}`));
    console.log(chalk.gray(`   Port: ${engineInfo.dockerPort}`));
    console.log(chalk.gray(`   Database: ${dbName}`));
    console.log(chalk.gray(`   User: ${dbUser}`));
    console.log(chalk.gray(`   Password: ${dbPassword.substring(0, 8)}...`));

    return {
      databaseUrl,
      dbMode: 'docker',
      dbEngine,
      dbHost: 'localhost',
      dbPort,
      dbUser,
      dbPassword,
      dbName,
      dbSsl: false,
      dockerCompose,
    };
  }

  private generateDockerCompose(
    _dbEngine: string,
    engineInfo: DbEngineInfo,
    vars: { dbName: string; dbUser: string; dbPassword: string }
  ): string {
    const envLines = Object.entries(engineInfo.envVars)
      .map(([key, val]) => {
        const resolved = val
          .replace('{{user}}', vars.dbUser)
          .replace('{{password}}', vars.dbPassword)
          .replace(/\{\{dbName\}\}/g, vars.dbName);
        return `      ${key}: ${resolved}`;
      })
      .join('\n');

    return `services:
  db:
    image: ${engineInfo.dockerImage}
    restart: unless-stopped
    ports:
      - "${engineInfo.dockerPort}"
    environment:
${envLines}
    volumes:
      - db_data:/var/lib/${engineInfo.dockerImage.split(':')[0] === 'mongo' ? 'mongodb' : engineInfo.dockerImage.split(':')[0] === 'mysql' || engineInfo.dockerImage.split(':')[0] === 'mariadb' ? 'mysql' : 'postgresql'}/data

volumes:
  db_data:
`;
  }

  private getSslParam(dbEngine: string, useSsl: boolean): string {
    if (!useSsl) {
      return '';
    }

    switch (dbEngine) {
      case 'postgresql':
        return '?sslmode=require';
      case 'mysql':
      case 'mariadb':
        return '?ssl=true';
      case 'mongodb':
        return '?tls=true';
      default:
        return '';
    }
  }

  private maskPassword(url: string): string {
    return url.replace(/:([^@]+)@/, ':****@');
  }
}
