import { execSync } from 'child_process';
import chalk from 'chalk';

export interface Requirement {
  name: string;
  command: string;
  versionFlag: string;
  minVersion?: string;
  installUrl: string;
  optional?: boolean;
}

export interface CheckResult {
  name: string;
  installed: boolean;
  version?: string;
  required: boolean;
  installUrl: string;
}

const KNOWN_REQUIREMENTS: Record<string, Requirement> = {
  node: {
    name: 'Node.js',
    command: 'node',
    versionFlag: '--version',
    minVersion: '16.0.0',
    installUrl: 'https://nodejs.org',
  },
  npm: {
    name: 'npm',
    command: 'npm',
    versionFlag: '--version',
    installUrl: 'https://nodejs.org',
  },
  pnpm: {
    name: 'pnpm',
    command: 'pnpm',
    versionFlag: '--version',
    installUrl: 'https://pnpm.io/installation',
  },
  yarn: {
    name: 'Yarn',
    command: 'yarn',
    versionFlag: '--version',
    installUrl: 'https://yarnpkg.com/getting-started/install',
  },
  bun: {
    name: 'Bun',
    command: 'bun',
    versionFlag: '--version',
    installUrl: 'https://bun.sh',
  },
  docker: {
    name: 'Docker',
    command: 'docker',
    versionFlag: '--version',
    installUrl: 'https://docs.docker.com/get-docker',
  },
  'docker-compose': {
    name: 'Docker Compose',
    command: 'docker',
    versionFlag: 'compose version',
    installUrl: 'https://docs.docker.com/compose/install',
  },
  git: {
    name: 'Git',
    command: 'git',
    versionFlag: '--version',
    installUrl: 'https://git-scm.com/downloads',
  },
  python: {
    name: 'Python',
    command: 'python3',
    versionFlag: '--version',
    minVersion: '3.8.0',
    installUrl: 'https://www.python.org/downloads',
  },
  pip: {
    name: 'pip',
    command: 'pip3',
    versionFlag: '--version',
    installUrl: 'https://pip.pypa.io/en/stable/installation',
  },
  flutter: {
    name: 'Flutter',
    command: 'flutter',
    versionFlag: '--version',
    installUrl: 'https://docs.flutter.dev/get-started/install',
  },
  dart: {
    name: 'Dart',
    command: 'dart',
    versionFlag: '--version',
    installUrl: 'https://dart.dev/get-dart',
  },
  go: {
    name: 'Go',
    command: 'go',
    versionFlag: 'version',
    installUrl: 'https://go.dev/dl',
  },
  rust: {
    name: 'Rust (cargo)',
    command: 'cargo',
    versionFlag: '--version',
    installUrl: 'https://rustup.rs',
  },
  java: {
    name: 'Java',
    command: 'java',
    versionFlag: '--version',
    installUrl: 'https://adoptium.net',
  },
  php: {
    name: 'PHP',
    command: 'php',
    versionFlag: '--version',
    installUrl: 'https://www.php.net/downloads',
  },
  composer: {
    name: 'Composer',
    command: 'composer',
    versionFlag: '--version',
    installUrl: 'https://getcomposer.org/download',
  },
  ruby: {
    name: 'Ruby',
    command: 'ruby',
    versionFlag: '--version',
    installUrl: 'https://www.ruby-lang.org/en/downloads',
  },
  postgresql: {
    name: 'PostgreSQL (psql)',
    command: 'psql',
    versionFlag: '--version',
    installUrl: 'https://www.postgresql.org/download',
  },
  mongodb: {
    name: 'MongoDB (mongosh)',
    command: 'mongosh',
    versionFlag: '--version',
    installUrl: 'https://www.mongodb.com/try/download/community',
  },
  redis: {
    name: 'Redis',
    command: 'redis-cli',
    versionFlag: '--version',
    installUrl: 'https://redis.io/download',
  },
};

export class RequirementsChecker {

  /**
   * Check all requirements for a template.
   * requirements: array of requirement keys (e.g. ["node", "docker", "postgresql"])
   * optionalRequirements: array of optional requirement keys
   */
  async check(
    requirements: string[],
    optionalRequirements: string[] = []
  ): Promise<CheckResult[]> {
    const allKeys = [...new Set([...requirements, ...optionalRequirements])];
    const results: CheckResult[] = [];

    for (const key of allKeys) {
      const req = KNOWN_REQUIREMENTS[key];
      const isRequired = requirements.includes(key) && !optionalRequirements.includes(key);

      if (!req) {
        // Unknown requirement - try to check it generically
        results.push(this.checkGeneric(key, isRequired));
        continue;
      }

      results.push(this.checkRequirement(key, req, isRequired));
    }

    return results;
  }

  private checkRequirement(key: string, req: Requirement, required: boolean): CheckResult {
    try {
      const output = execSync(`${req.command} ${req.versionFlag}`, {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10000,
      }).toString().trim();

      // Extract version number from output
      const versionMatch = output.match(/(\d+\.\d+[\.\d]*)/);
      const version = versionMatch ? versionMatch[1] : output.split('\n')[0];

      let installed = true;

      // Check minimum version if specified
      if (req.minVersion && versionMatch) {
        installed = this.compareVersions(versionMatch[1], req.minVersion) >= 0;
      }

      return {
        name: req.name,
        installed,
        version,
        required,
        installUrl: req.installUrl,
      };
    } catch (error) {
      // For python, try "python" if "python3" fails (Windows)
      if (key === 'python') {
        return this.checkFallbackCommand('python', '--version', req, required);
      }
      if (key === 'pip') {
        return this.checkFallbackCommand('pip', '--version', req, required);
      }

      return {
        name: req.name,
        installed: false,
        required,
        installUrl: req.installUrl,
      };
    }
  }

  private checkFallbackCommand(
    command: string,
    versionFlag: string,
    req: Requirement,
    required: boolean
  ): CheckResult {
    try {
      const output = execSync(`${command} ${versionFlag}`, {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10000,
      }).toString().trim();

      const versionMatch = output.match(/(\d+\.\d+[\.\d]*)/);
      const version = versionMatch ? versionMatch[1] : output.split('\n')[0];

      return {
        name: req.name,
        installed: true,
        version,
        required,
        installUrl: req.installUrl,
      };
    } catch {
      return {
        name: req.name,
        installed: false,
        required,
        installUrl: req.installUrl,
      };
    }
  }

  private checkGeneric(key: string, required: boolean): CheckResult {
    try {
      const output = execSync(`${key} --version`, {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10000,
      }).toString().trim();

      const versionMatch = output.match(/(\d+\.\d+[\.\d]*)/);

      return {
        name: key,
        installed: true,
        version: versionMatch ? versionMatch[1] : undefined,
        required,
        installUrl: '',
      };
    } catch {
      return {
        name: key,
        installed: false,
        required,
        installUrl: '',
      };
    }
  }

  private compareVersions(current: string, minimum: string): number {
    const a = current.split('.').map(Number);
    const b = minimum.split('.').map(Number);
    const len = Math.max(a.length, b.length);

    for (let i = 0; i < len; i++) {
      const av = a[i] || 0;
      const bv = b[i] || 0;
      if (av > bv) return 1;
      if (av < bv) return -1;
    }
    return 0;
  }

  /**
   * Print the results and return whether all required checks passed.
   */
  printResults(results: CheckResult[]): boolean {
    let allRequiredOk = true;

    for (const r of results) {
      const tag = r.required ? '' : chalk.gray(' (optional)');

      if (r.installed) {
        const ver = r.version ? chalk.gray(` v${r.version}`) : '';
        console.log(`  ${chalk.green('✔')} ${r.name}${ver}${tag}`);
      } else {
        if (r.required) {
          allRequiredOk = false;
          console.log(`  ${chalk.red('✘')} ${r.name} ${chalk.red('- not found')}${tag}`);
        } else {
          console.log(`  ${chalk.yellow('⚠')} ${r.name} ${chalk.yellow('- not found')}${tag}`);
        }
        if (r.installUrl) {
          console.log(`    ${chalk.gray('Install:')} ${chalk.cyan(r.installUrl)}`);
        }
      }
    }

    return allRequiredOk;
  }
}
