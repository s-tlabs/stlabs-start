# STLabs Start

[![NPM Version](https://img.shields.io/npm/v/stlabs-start.svg)](https://www.npmjs.com/package/stlabs-start)
[![NPM Downloads](https://img.shields.io/npm/dm/stlabs-start.svg)](https://www.npmjs.com/package/stlabs-start)
[![GitHub License](https://img.shields.io/github/license/s-tlabs/stlabs-start.svg)](https://github.com/s-tlabs/stlabs-start/blob/main/LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/s-tlabs/stlabs-start.svg)](https://github.com/s-tlabs/stlabs-start/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/s-tlabs/stlabs-start.svg)](https://github.com/s-tlabs/stlabs-start/issues)
[![Node.js Version](https://img.shields.io/node/v/stlabs-start.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org)

A CLI tool for generating projects with predefined boilerplates, downloading templates from GitHub and configuring variables automatically based on the selected stack.

## Features

- 🚀 **Simple**: Each template is a complete, functional project
- 🔧 **Flexible**: Automatic variable configuration per stack
- 📦 **Maintainable**: Independent, easy-to-update templates
- 🎯 **Interactive**: Intuitive developer experience

## Installation

```bash
npm install -g stlabs-start
```

Or use directly with npx:

```bash
npx stlabs-start
```

## Usage

### Interactive Mode

```bash
npx stlabs-start
```

### With Parameters

```bash
npx stlabs-start my-project nextjs-nextauth-postgres
```

### Advanced Options

```bash
# List available templates
npx stlabs-start --list

# Show template information
npx stlabs-start --info nextjs-nextauth-postgres

# Use configuration file
npx stlabs-start my-project --config config.json

# Update templates cache
npx stlabs-start --update
```

### System Health Check

```bash
# Check if your environment has all required tools
npx stlabs-start doctor
```

Verifies: Node.js version, GitHub authentication, template cache, network connectivity, and repository access.

Templates can also declare their own requirements (e.g. `docker`, `python`, `flutter`). When you select a template, the CLI automatically checks if the required tools are installed before proceeding.

### GitHub Authentication (for private templates)

```bash
# Setup GitHub token for private repositories
npx stlabs-start auth

# View current authentication
npx stlabs-start auth --view

# Clear authentication
npx stlabs-start auth --clear
```

**Environment Variables:**
```bash
# Set GitHub token via environment variable
export GITHUB_TOKEN=ghp_your_token_here
# or
export GH_TOKEN=ghp_your_token_here
```

## 🎯 Quick Start

```bash
# Create a new project interactively
npx stlabs-start

# Create project with specific template
npx stlabs-start my-app nextjs-nextauth-postgres

# List available templates
npx stlabs-start --list
```

### Interactive Flow

1. **Select Project Type**: Choose between Fullstack, Backend, Frontend, Mobile, and more
2. **Choose Template**: Select from available templates for your chosen category
3. **Check Requirements**: Automatically verifies required system tools are installed
4. **Configure Variables**: Set up project-specific variables
5. **Generate Project**: Your project is created and dependencies are installed

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `stlabs-start [project] [template]` | Create new project |
| `stlabs-start --list` | List available templates |
| `stlabs-start --info <template>` | Show template details |
| `stlabs-start --update` | Update template cache |
| `stlabs-start auth` | Configure GitHub authentication |
| `stlabs-start --search <keyword>` | Search templates by keyword |
| `stlabs-start doctor` | Check system health and dependencies |

## 🎨 Available Templates

Templates are loaded from [s-tlabs/boilerplates](https://github.com/s-tlabs/boilerplates) and organized by category:

### 🚀 Fullstack Templates
- **nextjs-nextauth-postgres** - Next.js + NextAuth + PostgreSQL
- **nextjs-clerk-supabase** - Next.js + Clerk + Supabase

### ⚙️ Backend Templates  
- **nestjs-jwt-postgres** - NestJS + JWT + PostgreSQL
- **express-mongodb** - Express + MongoDB

### 🎨 Frontend Templates
- **react-vite-tailwind** - React + Vite + Tailwind CSS
- **vue-nuxt** - Vue + Nuxt 3
- **svelte-kit** - SvelteKit

More templates coming soon...

## Development

```bash
# Clone the repository
git clone <repository-url>
cd stlabs-start

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev

# Run tests
npm test
```

## Project Structure

```
src/
├── commands/
│   ├── create.ts              # Main create command
│   ├── list.ts                # List available templates
│   ├── info.ts                # Show template details
│   ├── update.ts              # Update template cache
│   ├── auth.ts                # GitHub authentication
│   └── doctor.ts              # System health check
├── managers/
│   ├── template-manager.ts    # Template fetching & caching
│   ├── github-manager.ts      # GitHub archive download
│   ├── config-manager.ts      # Configuration & variables
│   ├── auth-manager.ts        # Token management
│   └── requirements-checker.ts # System dependency checks
├── utils/
│   └── validators.ts          # Input validation
├── __tests__/                 # Test suites
└── index.ts                   # CLI entry point
```

## Configuration

You can provide a configuration file to skip interactive prompts:

```json
{
  "projectName": "my-app",
  "projectDescription": "My awesome application",
  "authorName": "John Doe",
  "authorEmail": "john@example.com",
  "template": "nextjs-nextauth-postgres",
  "nextauthSecret": "your-secret-here",
  "databaseUrl": "postgresql://user:pass@localhost:5432/myapp"
}
```

## CI/CD

The project uses GitHub Actions for continuous integration and automated publishing.

### CI Pipeline (`.github/workflows/ci.yml`)

Runs automatically on every push and pull request to `main`:

- **Builds and tests** across Node.js 18, 20, and 22
- Ensures TypeScript compiles without errors
- Runs all test suites

### Automated npm Publishing (`.github/workflows/publish.yml`)

Publishes to npm automatically when a GitHub Release is created:

1. Builds the project
2. Runs all tests
3. Publishes to npm using the `NPM_TOKEN` secret

#### Setup

To enable automated publishing, configure the `NPM_TOKEN` secret in your GitHub repository:

1. Generate an npm access token:
   - Go to [npmjs.com](https://www.npmjs.com) → Account Settings → Access Tokens
   - Create a new **Automation** token
2. Add it to your GitHub repo:
   - Go to Settings → Secrets and variables → Actions
   - Create a new secret named `NPM_TOKEN` with the token value

#### Publishing a new version

```bash
# 1. Update version in package.json and src/index.ts
npm version patch   # or minor, or major

# 2. Push the version commit and tag
git push && git push --tags

# 3. Create a Release on GitHub from the tag
#    The publish workflow will run automatically
```

Alternatively, create a release directly from the GitHub UI:
- Go to Releases → Draft a new release
- Choose the tag (or create a new one)
- Click "Publish release" → npm publish runs automatically

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Creating Templates

See [templates.md](./templates.md) for detailed instructions on creating your own templates.

## 🐛 Issues & Support

- 🐛 [Report bugs](https://github.com/s-tlabs/stlabs-start/issues)
- 💬 [Ask questions](https://github.com/s-tlabs/stlabs-start/discussions)
- 💡 [Request features](https://github.com/s-tlabs/stlabs-start/issues/new)

## 📊 Stats

[![NPM Downloads](https://img.shields.io/npm/dt/stlabs-start.svg)](https://www.npmjs.com/package/stlabs-start)
[![GitHub Contributors](https://img.shields.io/github/contributors/s-tlabs/stlabs-start.svg)](https://github.com/s-tlabs/stlabs-start/graphs/contributors)
[![Last Commit](https://img.shields.io/github/last-commit/s-tlabs/stlabs-start.svg)](https://github.com/s-tlabs/stlabs-start/commits/main)

## 📄 License

MIT © [STLabs](https://github.com/s-tlabs)

---

<div align="center">
  <strong>Made with ❤️ by STLabs</strong>
  <br>
  <sub>Built with Claude Code</sub>
</div>