# STLabs Start

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

## Available Templates

- **nextjs-nextauth-postgres** - Next.js + NextAuth + PostgreSQL
- **nextjs-clerk-supabase** - Next.js + Clerk + Supabase  
- **nestjs-jwt-postgres** - NestJS + JWT + PostgreSQL
- **react-vite-tailwind** - React + Vite + Tailwind CSS

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

## License

MIT