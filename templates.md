# 📋 Guía para Crear Templates

Esta guía explica cómo crear templates para `stlabs-start` en el repositorio `s-tlabs/boilerplates`.

## 📁 Estructura del Repositorio

```
s-tlabs/boilerplates/
├── templates.json                    # Metadata global de todos los templates
├── nextjs-nextauth-postgres/         # Template completo
│   ├── template.json                # Configuración específica del template
│   ├── package.json.hbs            # Package.json con variables
│   ├── .env.example.hbs            # Variables de entorno
│   ├── README.md.hbs               # Documentación
│   ├── src/
│   │   ├── app/layout.tsx.hbs      # Archivos de código
│   │   └── lib/auth.ts.hbs
│   └── prisma/
│       └── schema.prisma.hbs
├── nextjs-clerk-supabase/
│   ├── template.json
│   ├── package.json.hbs
│   └── ...
└── react-vite-tailwind/
    ├── template.json
    ├── package.json.hbs
    └── ...
```

## 🗂️ Archivo `templates.json` (Raíz del repositorio)

Este archivo contiene la metadata de todos los templates disponibles:

```json
{
  "version": "1.0.0",
  "templates": {
    "nextjs-nextauth-postgres": {
      "name": "Next.js + NextAuth + PostgreSQL",
      "description": "Fullstack app con autenticación y base de datos",
      "category": "fullstack",
      "stack": ["nextjs", "nextauth", "prisma", "postgresql", "shadcn"],
      "features": ["Authentication", "Database", "UI Components", "TypeScript"],
      "variables": {
        "required": ["nextauthSecret", "databaseUrl"],
        "optional": ["googleClientId", "githubClientId"],
        "generated": ["nextauthUrl"]
      },
      "supports": ["google-oauth", "github-oauth", "email-auth"],
      "postInstall": ["npm install", "npx prisma generate", "npx prisma db push"]
    },
    "nextjs-clerk-supabase": {
      "name": "Next.js + Clerk + Supabase",
      "description": "Stack moderno con Clerk y Supabase backend",
      "category": "fullstack",
      "stack": ["nextjs", "clerk", "supabase", "tailwind"],
      "features": ["Authentication", "Database", "Real-time", "TypeScript"],
      "variables": {
        "required": ["clerkPublishableKey", "clerkSecretKey", "supabaseUrl", "supabaseAnonKey"],
        "optional": ["supabaseServiceKey"],
        "generated": []
      },
      "supports": ["social-auth", "email-auth"],
      "postInstall": ["npm install"]
    },
    "nestjs-jwt-postgres": {
      "name": "NestJS + JWT + PostgreSQL",
      "description": "API backend con JWT y PostgreSQL",
      "category": "backend",
      "stack": ["nestjs", "jwt", "prisma", "postgresql"],
      "features": ["REST API", "Authentication", "Database", "TypeScript"],
      "variables": {
        "required": ["jwtSecret", "databaseUrl"],
        "optional": ["apiPort", "corsOrigins"],
        "generated": ["apiPrefix"]
      },
      "supports": ["jwt-auth", "swagger"],
      "postInstall": ["npm install", "npx prisma generate"]
    },
    "react-vite-tailwind": {
      "name": "React + Vite + Tailwind",
      "description": "Frontend moderno con React, Vite y Tailwind CSS",
      "category": "frontend",
      "stack": ["react", "vite", "tailwind", "typescript"],
      "features": ["Fast HMR", "Tailwind CSS", "TypeScript", "ESLint"],
      "variables": {
        "required": [],
        "optional": ["apiBaseUrl"],
        "generated": []
      },
      "supports": ["hot-reload", "css-framework"],
      "postInstall": ["npm install"]
    }
  }
}
```

### 📝 Propiedades del Template:

- **name**: Nombre descriptivo del template
- **description**: Descripción breve de qué hace
- **category**: `fullstack`, `backend`, `frontend`
- **stack**: Array de tecnologías utilizadas
- **features**: Array de características principales
- **variables**: 
  - `required`: Variables obligatorias que debe proporcionar el usuario
  - `optional`: Variables opcionales
  - `generated`: Variables generadas automáticamente
- **supports**: Funcionalidades que soporta el template
- **postInstall**: Comandos a ejecutar después de la generación

## ⚙️ Archivo `template.json` (Específico por template)

Cada template debe tener su propio `template.json` con prompts específicos:

### Ejemplo: `nextjs-nextauth-postgres/template.json`

```json
{
  "name": "nextjs-nextauth-postgres",
  "prompts": [
    {
      "type": "password",
      "name": "nextauthSecret",
      "message": "🔐 NextAuth Secret (deja vacío para auto-generar):",
      "default": ""
    },
    {
      "type": "input",
      "name": "databaseUrl",
      "message": "🗄️ Database URL:",
      "default": "postgresql://user:password@localhost:5432/{{projectName}}",
      "validate": "databaseUrl"
    },
    {
      "type": "confirm",
      "name": "enableGoogleAuth",
      "message": "🔐 ¿Habilitar autenticación con Google?",
      "default": false
    },
    {
      "type": "confirm",
      "name": "enableGithubAuth",
      "message": "🔐 ¿Habilitar autenticación con GitHub?",
      "default": false
    }
  ],
  "conditionalPrompts": {
    "enableGoogleAuth": [
      {
        "type": "input",
        "name": "googleClientId",
        "message": "🔑 Google Client ID:",
        "validate": "googleClientId"
      },
      {
        "type": "password",
        "name": "googleClientSecret",
        "message": "🔒 Google Client Secret:",
        "validate": "required"
      }
    ],
    "enableGithubAuth": [
      {
        "type": "input",
        "name": "githubClientId",
        "message": "🔑 GitHub Client ID:",
        "validate": "required"
      },
      {
        "type": "password",
        "name": "githubClientSecret",
        "message": "🔒 GitHub Client Secret:",
        "validate": "required"
      }
    ]
  },
  "generatedVars": {
    "nextauthUrl": "http://localhost:3000",
    "apiPrefix": "/api"
  }
}
```

### Ejemplo: `nextjs-clerk-supabase/template.json`

```json
{
  "name": "nextjs-clerk-supabase",
  "prompts": [
    {
      "type": "input",
      "name": "clerkPublishableKey",
      "message": "🔑 Clerk Publishable Key:",
      "validate": "clerkKey"
    },
    {
      "type": "password",
      "name": "clerkSecretKey",
      "message": "🔒 Clerk Secret Key:",
      "validate": "clerkKey"
    },
    {
      "type": "input",
      "name": "supabaseUrl",
      "message": "🗄️ Supabase URL:",
      "validate": "supabaseUrl"
    },
    {
      "type": "password",
      "name": "supabaseAnonKey",
      "message": "🔑 Supabase Anon Key:",
      "validate": "required"
    },
    {
      "type": "confirm",
      "name": "includeServiceKey",
      "message": "🔐 ¿Incluir Service Key de Supabase?",
      "default": false
    }
  ],
  "conditionalPrompts": {
    "includeServiceKey": [
      {
        "type": "password",
        "name": "supabaseServiceKey",
        "message": "🔒 Supabase Service Key:",
        "validate": "required"
      }
    ]
  },
  "generatedVars": {}
}
```

### 📝 Tipos de Prompts:

- **input**: Campo de texto
- **password**: Campo oculto
- **confirm**: Sí/No (boolean)
- **list**: Selección de opciones
- **number**: Número

### ✅ Validadores disponibles:

- `required`: Campo obligatorio
- `email`: Email válido
- `url`: URL válida
- `databaseUrl`: URL de base de datos
- `projectName`: Nombre de proyecto válido
- `port`: Puerto válido (1-65535)
- `googleClientId`: Client ID de Google
- `clerkKey`: Clave de Clerk
- `supabaseUrl`: URL de Supabase

## 📦 Archivos Template con Handlebars

Todos los archivos que terminen en `.hbs` serán procesados con Handlebars.

### Ejemplo: `package.json.hbs` para Next.js

```json
{
  "name": "{{projectName}}",
  "version": "0.1.0",
  "description": "{{projectDescription}}",
  "private": true,
  "author": "{{authorName}} <{{authorEmail}}>",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    {{#if databaseUrl}}
    "db:generate": "npx prisma generate",
    "db:push": "npx prisma db push",
    "db:migrate": "npx prisma migrate dev",
    {{/if}}
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    {{#if enableNextAuth}}
    "next-auth": "^4.24.0",
    {{/if}}
    {{#if enableGoogleAuth}}
    "@auth/google-adapter": "^0.2.0",
    {{/if}}
    {{#if enableGithubAuth}}
    "@auth/github-adapter": "^0.2.0",
    {{/if}}
    {{#if databaseUrl}}
    "@prisma/client": "^5.6.0",
    {{/if}}
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "typescript": "^5.0.0"
  },
  "devDependencies": {
    {{#if databaseUrl}}
    "prisma": "^5.6.0",
    {{/if}}
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0"
  }
}
```

### Ejemplo: `.env.example.hbs`

```bash
# Información del proyecto
PROJECT_NAME={{projectName}}
PROJECT_DESCRIPTION="{{projectDescription}}"

{{#if nextauthSecret}}
# NextAuth Configuration
NEXTAUTH_SECRET={{nextauthSecret}}
NEXTAUTH_URL={{nextauthUrl}}
{{/if}}

{{#if databaseUrl}}
# Database
DATABASE_URL="{{databaseUrl}}"
{{/if}}

{{#if enableGoogleAuth}}
# Google OAuth
GOOGLE_CLIENT_ID={{googleClientId}}
GOOGLE_CLIENT_SECRET={{googleClientSecret}}
{{/if}}

{{#if enableGithubAuth}}
# GitHub OAuth
GITHUB_CLIENT_ID={{githubClientId}}
GITHUB_CLIENT_SECRET={{githubClientSecret}}
{{/if}}

{{#if clerkPublishableKey}}
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY={{clerkPublishableKey}}
CLERK_SECRET_KEY={{clerkSecretKey}}
{{/if}}

{{#if supabaseUrl}}
# Supabase
NEXT_PUBLIC_SUPABASE_URL={{supabaseUrl}}
NEXT_PUBLIC_SUPABASE_ANON_KEY={{supabaseAnonKey}}
{{#if supabaseServiceKey}}
SUPABASE_SERVICE_KEY={{supabaseServiceKey}}
{{/if}}
{{/if}}
```

### Ejemplo: `README.md.hbs`

```markdown
# {{projectName}}

{{#if projectDescription}}
{{projectDescription}}
{{else}}
Proyecto generado con STLabs Start
{{/if}}

## Stack Tecnológico

{{#each stack}}
- {{this}}
{{/each}}

## Configuración

1. Instalar dependencias:
   ```bash
   npm install
   ```

{{#if databaseUrl}}
2. Configurar base de datos:
   ```bash
   # Copiar variables de entorno
   cp .env.example .env
   
   # Generar esquema de Prisma
   npx prisma generate
   
   # Aplicar migraciones
   npx prisma db push
   ```
{{/if}}

3. Iniciar en desarrollo:
   ```bash
   npm run dev
   ```

## Variables de Entorno

Copia `.env.example` a `.env` y configura las siguientes variables:

{{#if nextauthSecret}}
- `NEXTAUTH_SECRET`: Secret para NextAuth
- `NEXTAUTH_URL`: URL base de la aplicación
{{/if}}

{{#if databaseUrl}}
- `DATABASE_URL`: Cadena de conexión a la base de datos
{{/if}}

{{#if enableGoogleAuth}}
- `GOOGLE_CLIENT_ID`: Client ID de Google OAuth
- `GOOGLE_CLIENT_SECRET`: Client Secret de Google OAuth
{{/if}}

{{#if clerkPublishableKey}}
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clave pública de Clerk
- `CLERK_SECRET_KEY`: Clave secreta de Clerk
{{/if}}

{{#if supabaseUrl}}
- `NEXT_PUBLIC_SUPABASE_URL`: URL de tu proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Clave anónima de Supabase
{{/if}}

## Autor

**{{authorName}}**
{{#if authorEmail}}
- Email: {{authorEmail}}
{{/if}}
{{#if gitRepository}}
- Repositorio: {{gitRepository}}
{{/if}}

---

*Generado con [STLabs Start](https://github.com/s-tlabs/stlabs-start)*
```

### Ejemplo: `src/app/layout.tsx.hbs` (Next.js)

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
{{#if clerkPublishableKey}}
import { ClerkProvider } from '@clerk/nextjs'
{{/if}}

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '{{projectName}}',
  description: '{{projectDescription}}',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    {{#if clerkPublishableKey}}
    <ClerkProvider>
    {{/if}}
      <html lang="es">
        <body className={inter.className}>
          {children}
        </body>
      </html>
    {{#if clerkPublishableKey}}
    </ClerkProvider>
    {{/if}}
  )
}
```

## 🔧 Sintaxis de Handlebars

### Variables simples:
```handlebars
{{projectName}}
{{authorEmail}}
```

### Condicionales:
```handlebars
{{#if enableGoogleAuth}}
  // Código para Google Auth
{{/if}}

{{#unless disableFeature}}
  // Código cuando la feature NO está deshabilitada
{{/unless}}
```

### Bucles:
```handlebars
{{#each stack}}
- {{this}}
{{/each}}

{{#each dependencies}}
"{{@key}}": "{{this}}"{{#unless @last}},{{/unless}}
{{/each}}
```

### Condicionales con else:
```handlebars
{{#if projectDescription}}
{{projectDescription}}
{{else}}
Descripción por defecto
{{/if}}
```

## 📋 Checklist para crear un template

1. ✅ **Crear directorio** con nombre del template
2. ✅ **Añadir entrada** en `templates.json`
3. ✅ **Crear `template.json`** con prompts específicos
4. ✅ **Crear `package.json.hbs`** con dependencias
5. ✅ **Crear `.env.example.hbs`** con variables
6. ✅ **Crear `README.md.hbs`** con documentación
7. ✅ **Añadir archivos de código** con `.hbs`
8. ✅ **Probar template** con la CLI
9. ✅ **Verificar que compila/instala** correctamente
10. ✅ **Documentar variables** en README

## 🚨 Consejos importantes

1. **Nombres consistentes**: Usa nombres de variables consistentes entre `templates.json` y `template.json`
2. **Validación**: Always validate user inputs with appropriate validators
3. **Defaults sensatos**: Provide reasonable defaults for optional fields
4. **Documentación**: Include clear documentation in README.md.hbs
5. **Testing**: Test your templates thoroughly before publishing
6. **Versionado**: Keep templates.json version updated when making changes

¡Con esta estructura puedes crear templates robustos y reutilizables para `stlabs-start`!