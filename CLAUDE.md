# STLabs Start - Claude Skill Guide

## Project Overview

CLI tool (`stlabs-start`) that generates projects from predefined boilerplates hosted in `s-tlabs/boilerplates`. Built with TypeScript, Commander.js, Inquirer, and Handlebars.

## Architecture

```
src/
├── index.ts                          # CLI entry point (Commander.js)
├── commands/
│   ├── create.ts                     # Main creation flow (interactive + direct)
│   ├── list.ts                       # List templates grouped by category
│   ├── info.ts                       # Show template details
│   ├── update.ts                     # Refresh template cache
│   ├── search.ts                     # Search templates by keyword
│   ├── auth.ts                       # GitHub token management
│   └── doctor.ts                     # System health check
├── managers/
│   ├── template-manager.ts           # Fetches templates.json, caching (1h TTL in ~/.stlabs-cache)
│   ├── github-manager.ts             # Downloads repo tarball, extracts template, processes .hbs files
│   ├── config-manager.ts             # Variable generation, template-specific prompts/generators
│   ├── auth-manager.ts               # GitHub token (env vars, ~/.stlabs-config.json)
│   └── requirements-checker.ts       # Checks system deps (node, docker, python, flutter, etc.)
├── utils/
│   ├── validators.ts                 # Reusable validators (projectName, email, url, port, etc.)
│   ├── update-notifier.ts            # Checks npm for newer CLI versions
│   └── prompt-timeout.ts             # 5-minute inactivity timeout for prompts
├── __tests__/                        # Jest test suites
.github/
├── workflows/
│   ├── ci.yml                        # CI: build + test on Node 18/20/22 (push & PR to main)
│   └── publish.yml                   # Publish to npm on GitHub Release
```

## Templates Repository: s-tlabs/boilerplates

Templates live in a separate repo. The CLI downloads the entire repo as a tarball and extracts the specific template directory.

### Key Files in Boilerplates Repo

1. **`templates.json`** (root) - Global registry of ALL templates
2. **`<template-key>/template.json`** - Per-template config (prompts, conditional prompts, generated vars)
3. **`<template-key>/**/*.hbs`** - Handlebars template files (processed and .hbs extension removed)
4. **`<template-key>/**/*`** - Regular files ({{variable}} patterns replaced)

---

## How to Add a New Template

### Step 1: Choose a unique template key

Format: `technology-feature-database` (lowercase, hyphen-separated).
Examples: `nextjs-nextauth-postgres`, `fastapi-jwt-mongodb`, `flutter-riverpod-firebase`

**CRITICAL: The key MUST be unique across ALL templates in templates.json. Before adding, verify no existing template uses the same key.**

### Step 2: Add entry to `templates.json` in boilerplates repo

```json
{
  "templates": {
    "my-new-template": {
      "name": "Display Name Here",
      "description": "Short description of what this template provides",
      "category": "fullstack|backend|frontend|mobile|extension|monorepo|tooling|bot",
      "stack": ["tech1", "tech2", "tech3"],
      "features": ["Feature 1", "Feature 2"],
      "variables": {
        "required": ["var1", "var2"],
        "optional": ["var3"],
        "generated": ["autoVar1"]
      },
      "supports": ["feature-flag-1", "feature-flag-2"],
      "postInstall": ["npm install", "npx prisma generate"],
      "requirements": ["node", "docker"],
      "optionalRequirements": ["postgresql"]
    }
  }
}
```

### Step 3: Create template directory

```
my-new-template/
├── template.json          # Prompts and config (REQUIRED)
├── package.json.hbs       # Use .hbs for files with variables
├── .env.example.hbs
├── README.md.hbs
├── src/
│   └── index.ts.hbs
└── static-file.txt        # Regular files are copied as-is ({{var}} still replaced)
```

### Step 4: Create `template.json`

```json
{
  "name": "my-new-template",
  "prompts": [
    {
      "type": "input|password|confirm|list|number",
      "name": "variableName",
      "message": "Prompt message:",
      "default": "default value",
      "validate": "validatorName"
    }
  ],
  "conditionalPrompts": {
    "enableFeatureX": [
      {
        "type": "input",
        "name": "featureXKey",
        "message": "Feature X API Key:",
        "validate": "required"
      }
    ]
  },
  "generatedVars": {
    "autoVar1": "http://localhost:3000"
  }
}
```

### Step 5: (Optional) Add generators in config-manager.ts

If the template needs auto-generated secrets or computed values, add entries to:
- `getTemplateGenerators()` - Maps template key to variable generators
- `getDefaultPrompts()` - Fallback prompts if template.json is missing
- `getConditionalPrompts()` - Conditional prompts triggered by user answers

### Step 6: (Optional) Add system requirements

In `templates.json`, use `requirements` for mandatory tools and `optionalRequirements` for nice-to-have tools.

Available requirement keys: `node`, `npm`, `pnpm`, `yarn`, `bun`, `docker`, `docker-compose`, `git`, `python`, `pip`, `flutter`, `dart`, `go`, `rust`, `java`, `php`, `composer`, `ruby`, `postgresql`, `mongodb`, `redis`

To add a NEW requirement key, add it to `KNOWN_REQUIREMENTS` in `src/managers/requirements-checker.ts`.

---

## Template Variables

### Built-in Variables (always available)

| Variable | Source |
|----------|--------|
| `projectName` | User input or CLI argument |
| `projectDescription` | User input |
| `authorName` | User input |
| `authorEmail` | User input |
| `packageManager` | User selection (npm/pnpm/yarn/bun) |

### Auto-generated Variables (config-manager.ts)

| Variable | Generator |
|----------|-----------|
| `nextauthSecret` | `crypto.randomBytes(32).toString('hex')` |
| `jwtSecret` | `crypto.randomBytes(64).toString('hex')` |
| `sessionSecret` | `crypto.randomBytes(32).toString('hex')` |
| `nextauthUrl` | `http://localhost:3000` |
| `apiBaseUrl` | `http://localhost:3001/api` |
| `databaseUrl` | `postgresql://user:password@localhost:5432/<projectName>` |
| `apiPrefix` | `/api/v1` |
| `apiPort` | `3001` |
| `corsOrigins` | `["http://localhost:3000"]` |
| `jwtExpiresIn` | `7d` |
| `smtpPort` | `587` |

### Available Validators (utils/validators.ts)

`required`, `projectName`, `email`, `url`, `databaseUrl`, `port`, `googleClientId`, `clerkKey`, `supabaseUrl`

---

## Template Categories

| Category | Value | Description |
|----------|-------|-------------|
| Fullstack | `fullstack` | Frontend + backend integrated (Next.js, Nuxt, etc.) |
| Backend | `backend` | APIs and services (Express, NestJS, FastAPI, etc.) |
| Frontend | `frontend` | UI applications (React, Vue, Svelte, etc.) |
| Mobile | `mobile` | Mobile apps (Flutter, React Native, etc.) |
| Extension | `extension` | Browser extensions |
| Monorepo | `monorepo` | Multi-package projects |
| Tooling | `tooling` | CLI tools and utilities |
| Bot | `bot` | Bots and automations |

---

## Handlebars Syntax in .hbs Files

```handlebars
{{variableName}}              // Simple variable
{{#if enableAuth}}...{{/if}}  // Conditional block
{{#unless skip}}...{{/unless}} // Negated conditional
{{#each items}}{{this}}{{/each}} // Loop
{{#if a}}...{{else}}...{{/if}} // If/else
```

---

## File Processing Rules

1. **`.hbs` files**: Processed with Handlebars engine, then `.hbs` extension is removed
2. **Regular text files**: Simple `{{variable}}` pattern replacement
3. **Binary files**: Skipped entirely (`.png`, `.jpg`, `.gif`, `.ico`, `.svg`, `.woff`, `.woff2`, `.ttf`, `.eot`, `.exe`, `.dll`, `.so`, `.dylib`, `.zip`, `.tar`, `.gz`, `.rar`)

---

## Duplicate Template Validation

Before adding a template, the CLI validates uniqueness through `TemplateManager.validateTemplate()`. The `templates.json` uses template keys as object keys, so JSON itself prevents duplicates at the data level. However, when editing `templates.json` manually:

- **Always check** that the new key doesn't already exist
- **Keys are case-sensitive**: `my-template` and `My-Template` would be different keys (but avoid this)
- **Convention**: Always use lowercase with hyphens

---

## CLI Flow (create command)

1. Load config file (if `--config` provided)
2. Get basic info (projectName, description, author)
3. Check if project directory already exists (prompt to overwrite)
4. Select category -> Select template
5. Select variant (if template has variants)
6. **Check system requirements** (from template's `requirements` field)
7. Select package manager (if Node.js template)
8. Configure template variables (prompts from template.json)
9. Download repo tarball from GitHub (with retry, progress bar)
10. Extract template directory, process files
11. Ask to auto-install dependencies
12. Run postInstall commands (e.g. `npx prisma generate`)
13. Initialize git repository with initial commit
14. Show next steps

Note: A 5-minute inactivity timeout applies to all interactive prompts.

---

## Development Commands

```bash
npm run dev          # Run with ts-node
npm run build        # Compile TypeScript
npm test             # Run Jest tests
npm start            # Run compiled dist/
```

## Testing

Tests are in `src/__tests__/`. Run with `npm test`.
- `validators.test.ts` - All validator functions
- `config-manager.test.ts` - Config loading, saving, variable generation
- `requirements-checker.test.ts` - System dependency detection
- `template-manager.test.ts` - Cache logic, validation

## CI/CD

### CI (`.github/workflows/ci.yml`)
- **Trigger**: Push or PR to `main`
- **Matrix**: Node.js 18, 20, 22
- **Steps**: `npm ci` → `npm run build` → `npm test`

### Publish (`.github/workflows/publish.yml`)
- **Trigger**: GitHub Release created
- **Steps**: `npm ci` → build → test → `npm publish`
- **Requires**: `NPM_TOKEN` secret configured in the repo (npm Automation token)

### Publishing a new version
1. Update version in `package.json` (also update `.version()` in `src/index.ts` to match)
2. `npm version patch|minor|major` (bumps + creates git tag)
3. `git push && git push --tags`
4. Create a GitHub Release from the tag → publish workflow runs automatically

### Update notifications
The CLI checks npm for newer versions on every run (non-blocking, 5s timeout). If a new version exists, it shows a banner to the user suggesting `npm i -g stlabs-start`.

---

## Key Conventions

- Error messages include troubleshooting tips
- Use `chalk` for colors, `ora` for spinners, `inquirer` for prompts
- UI messages are mixed English/Spanish
- Cache lives at `~/.stlabs-cache/`, auth config at `~/.stlabs-config.json`
- GitHub tarball download with 3 retries and progress tracking
- Rollback (delete project dir) on generation failure
- template.json is validated on load: malformed prompts are filtered with warnings
- postInstall commands from templates.json are executed after dependency installation
- Git repo is initialized automatically with an initial commit
