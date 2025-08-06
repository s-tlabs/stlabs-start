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

1. **Select Project Type**: Choose between Fullstack, Backend, or Frontend
2. **Choose Template**: Select from available templates for your chosen category
3. **Configure Variables**: Set up project-specific variables
4. **Generate Project**: Your project is created with all dependencies

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `stlabs-start [project] [template]` | Create new project |
| `stlabs-start --list` | List available templates |
| `stlabs-start --info <template>` | Show template details |
| `stlabs-start --update` | Update template cache |
| `stlabs-start auth` | Configure GitHub authentication |

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
│   └── create.ts          # Main create command
├── managers/
│   ├── template-manager.ts # Template management
│   ├── github-manager.ts   # GitHub operations
│   └── config-manager.ts   # Configuration handling
├── utils/
│   └── validators.ts       # Input validation
└── index.ts               # CLI entry point
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