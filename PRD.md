# Boilerplate CLI Generator - Especificación de Requerimientos

## 📋 Resumen del Proyecto

Herramienta CLI que permite generar proyectos con boilerplates predefinidos, descargando templates desde GitHub y configurando automáticamente las variables específicas según el stack seleccionado.

## 🎯 Objetivos

- **Simplicidad**: Cada template es un proyecto completo y funcional
- **Flexibilidad**: Configuración automática de variables según stack
- **Mantenibilidad**: Templates independientes y fáciles de actualizar
- **Experiencia**: Proceso interactivo e intuitivo para el desarrollador

## 📁 Arquitectura del Proyecto

### Repositorio de Templates
```
boilerplate-templates/
├── templates.json                    # Metadata global
├── nextjs-nextauth-postgres/         # Template completo
├── nextjs-clerk-supabase/           # Template completo  
├── nestjs-jwt-postgres/             # Template completo
└── react-vite-tailwind/             # Template completo
```

### CLI Tool
```
create-my-boilerplate/
├── src/
│   ├── commands/create.js
│   ├── managers/
│   │   ├── template-manager.js
│   │   ├── github-manager.js
│   │   └── config-manager.js
│   └── utils/
└── package.json
```

## 🔧 Funcionalidades Core

### 1. Selección de Templates
- **Listado interactivo** de templates disponibles
- **Categorización** por tipo (fullstack, backend, frontend)
- **Filtrado** por stack/tecnología
- **Descripción detallada** de cada template

### 2. Configuración Dinámica de Variables

#### Variables Globales (Todos los templates)
```javascript
{
  projectName: string,          // Nombre del proyecto
  projectDescription: string,   // Descripción opcional
  authorName: string,          // Nombre del desarrollador
  authorEmail: string,         // Email del desarrollador
  gitRepository: string        // URL del repo (opcional)
}
```

#### Variables por Stack

**Next.js Templates:**
```javascript
{
  // Autenticación
  nextauthSecret: string,       // Secret para NextAuth
  nextauthUrl: string,         // URL base de la app
  
  // Base de datos
  databaseUrl: string,         // Connection string
  databaseName: string,        // Nombre de la BD
  
  // Providers externos
  googleClientId: string,      // OAuth Google (si aplica)
  googleClientSecret: string,  // OAuth Google (si aplica)
  githubClientId: string,      // OAuth GitHub (si aplica)
  githubClientSecret: string,  // OAuth GitHub (si aplica)
  
  // Clerk (si aplica)
  clerkPublishableKey: string,
  clerkSecretKey: string,
  
  // Supabase (si aplica)
  supabaseUrl: string,
  supabaseAnonKey: string,
  supabaseServiceKey: string
}
```

**NestJS Templates:**
```javascript
{
  // JWT
  jwtSecret: string,           // JWT Secret
  jwtExpiresIn: string,        // Token expiration
  
  // Base de datos  
  databaseUrl: string,
  databaseName: string,
  
  // API Config
  apiPort: number,             // Puerto de la API
  apiPrefix: string,           // Prefijo de rutas (/api/v1)
  corsOrigins: string[],       // CORS origins
  
  // Email (si aplica)
  smtpHost: string,
  smtpPort: number,
  smtpUser: string,
  smtpPassword: string
}
```

**React/Frontend Templates:**
```javascript
{
  // API Backend
  apiBaseUrl: string,          // URL del backend
  
  // Supabase (si aplica)
  supabaseUrl: string,
  supabaseAnonKey: string,
  
  // Clerk (si aplica)  
  clerkPublishableKey: string
}
```

### 3. Prompts Inteligentes

#### Flujo de Configuración
```javascript
// 1. Información básica
const basicInfo = await inquirer.prompt([
  { name: 'projectName', message: '📦 Nombre del proyecto:' },
  { name: 'projectDescription', message: '📝 Descripción (opcional):' },
  { name: 'authorName', message: '👤 Tu nombre:' }
]);

// 2. Selección de template
const templateChoice = await inquirer.prompt([
  {
    type: 'list',
    name: 'template',
    message: '🎯 Selecciona un template:',
    choices: getAvailableTemplates()
  }
]);

// 3. Configuración específica del template
const templateConfig = await getTemplateConfig(templateChoice.template);
const stackConfig = await inquirer.prompt(templateConfig.prompts);

// 4. Configuración avanzada (opcional)
const advancedConfig = await inquirer.prompt([
  {
    type: 'confirm',
    name: 'configureAdvanced',
    message: '⚙️ ¿Configurar opciones avanzadas?',
    default: false
  }
]);
```

#### Prompts Condicionales
```javascript
// Ejemplo: Solo preguntar por OAuth si el template lo soporta
{
  type: 'confirm',
  name: 'enableGoogleAuth',
  message: '🔐 ¿Habilitar autenticación con Google?',
  when: (answers) => templateSupports(answers.template, 'google-oauth'),
  default: false
},
{
  type: 'input',
  name: 'googleClientId',
  message: '🔑 Google Client ID:',
  when: (answers) => answers.enableGoogleAuth,
  validate: validateGoogleClientId
}
```

## 📋 Metadata de Templates

### `templates.json`
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
    }
  }
}
```

### `template.json` (Específico por template)
```json
{
  "name": "nextjs-nextauth-postgres",
  "prompts": [
    {
      "type": "input",
      "name": "projectName",
      "message": "📦 Nombre del proyecto:",
      "validate": "^[a-z][a-z0-9-]*$"
    },
    {
      "type": "password",
      "name": "nextauthSecret", 
      "message": "🔐 NextAuth Secret:",
      "generate": "crypto.randomBytes(32).toString('hex')",
      "default": "auto-generate"
    },
    {
      "type": "input",
      "name": "databaseUrl",
      "message": "🗄️ Database URL:",
      "default": "postgresql://user:password@localhost:5432/{{projectName}}",
      "validate": "isValidDatabaseUrl"
    },
    {
      "type": "confirm",
      "name": "enableGoogleAuth",
      "message": "🔐 ¿Habilitar Google OAuth?",
      "default": false
    }
  ],
  "conditionalPrompts": {
    "enableGoogleAuth": [
      {
        "type": "input",
        "name": "googleClientId",
        "message": "🔑 Google Client ID:"
      },
      {
        "type": "password", 
        "name": "googleClientSecret",
        "message": "🔒 Google Client Secret:"
      }
    ]
  },
  "generatedVars": {
    "nextauthUrl": "http://localhost:3000"
  }
}
```

## 🔄 Flujo de Ejecución

### 1. Inicialización
```bash
npx create-my-boilerplate
```

### 2. Selección y Configuración
1. **Prompt básico**: Nombre, descripción, autor
2. **Template selection**: Lista filtrable de templates
3. **Stack configuration**: Variables específicas del template
4. **Advanced options**: Configuración opcional avanzada

### 3. Generación del Proyecto
1. **Download**: Descargar template desde GitHub
2. **Variable replacement**: Procesar archivos `.hbs` con Handlebars
3. **File generation**: Crear archivos finales con variables reemplazadas
4. **Post-install**: Ejecutar comandos de instalación y setup

### 4. Finalización
1. **Git init**: Inicializar repositorio git
2. **Install dependencies**: npm/yarn install automático
3. **Success message**: Instrucciones para continuar

## 🛠️ Generación y Validación de Variables

### Generadores Automáticos
```javascript
const generators = {
  // Secrets y tokens
  nextauthSecret: () => crypto.randomBytes(32).toString('hex'),
  jwtSecret: () => crypto.randomBytes(64).toString('hex'),
  
  // URLs
  nextauthUrl: (projectName) => `http://localhost:3000`,
  apiBaseUrl: (projectName) => `http://localhost:3001/api`,
  
  // Database
  databaseUrl: (projectName, dbType) => {
    const urls = {
      postgres: `postgresql://user:password@localhost:5432/${projectName}`,
      mysql: `mysql://user:password@localhost:3306/${projectName}`,
      mongodb: `mongodb://localhost:27017/${projectName}`
    };
    return urls[dbType];
  }
};
```

### Validadores
```javascript
const validators = {
  projectName: (value) => /^[a-z][a-z0-9-]*$/.test(value),
  databaseUrl: (value) => isValidUrl(value) && value.includes('://'),
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  port: (value) => Number.isInteger(value) && value > 0 && value < 65536
};
```

## 📁 Estructura de Archivos Template

### Archivos Handlebars
```
nextjs-nextauth-postgres/
├── package.json.hbs              # Dependencies y scripts
├── .env.example.hbs              # Variables de entorno
├── README.md.hbs                 # Documentación
├── src/
│   ├── app/layout.tsx.hbs        # Layout con metadata
│   └── lib/auth.ts.hbs           # Configuración auth
├── prisma/
│   └── schema.prisma.hbs         # Schema de BD
└── docker-compose.yml.hbs        # Docker setup (opcional)
```

### Variables en Templates
```javascript
// package.json.hbs
{
  "name": "{{projectName}}",
  "description": "{{projectDescription}}",
  "author": "{{authorName}} <{{authorEmail}}>",
  "dependencies": {
    "next": "^14.0.0",
    {{#if enableGoogleAuth}}
    "google-auth-library": "^9.0.0",
    {{/if}}
  }
}
```

```bash
# .env.example.hbs
NEXTAUTH_SECRET={{nextauthSecret}}
NEXTAUTH_URL={{nextauthUrl}}
DATABASE_URL="{{databaseUrl}}"

{{#if enableGoogleAuth}}
GOOGLE_CLIENT_ID={{googleClientId}}
GOOGLE_CLIENT_SECRET={{googleClientSecret}}
{{/if}}
```

## 🚀 Comandos del CLI

### Comando Principal
```bash
npx create-my-boilerplate [project-name] [template]
```

### Opciones Avanzadas
```bash
# Modo no interactivo
npx create-my-boilerplate my-app nextjs-nextauth-postgres --config config.json

# Listar templates disponibles
npx create-my-boilerplate --list

# Ver detalles de un template
npx create-my-boilerplate --info nextjs-nextauth-postgres

# Actualizar cache de templates
npx create-my-boilerplate --update
```

## 🧪 Testing y Validación

### Tests Automáticos
```javascript
// Para cada template, verificar:
describe('Template Generation', () => {
  test('generates valid project structure', async () => {
    const project = await generateProject('test-project', template, config);
    expect(fs.existsSync(`${project}/package.json`)).toBe(true);
    expect(fs.existsSync(`${project}/src`)).toBe(true);
  });
  
  test('replaces variables correctly', async () => {
    const packageJson = require(`${project}/package.json`);
    expect(packageJson.name).toBe('test-project');
    expect(packageJson.author).toContain(config.authorName);
  });
  
  test('project builds successfully', async () => {
    const result = await exec('npm run build', { cwd: project });
    expect(result.code).toBe(0);
  });
});
```

## 📦 Distribución

### NPM Package
```json
{
  "name": "create-my-boilerplate",
  "version": "1.0.0",
  "bin": {
    "create-my-boilerplate": "./dist/index.js"
  },
  "keywords": ["boilerplate", "template", "cli", "nextjs", "nestjs"],
  "repository": "https://github.com/user/create-my-boilerplate"
}
```

### GitHub Templates Repository
- **Público**: Para templates open source
- **Privado**: Para templates empresariales
- **Versionado**: Tags para releases estables
- **CI/CD**: Tests automáticos en cada template

## 🎯 Roadmap

### Fase 1: MVP
- [x] CLI básico con selección de templates
- [x] Descarga desde GitHub
- [x] Reemplazo de variables básicas
- [x] 3-5 templates esenciales

### Fase 2: Configuración Avanzada  
- [ ] Prompts condicionales inteligentes
- [ ] Generadores automáticos de secrets
- [ ] Validación de variables
- [ ] Configuración desde archivo

### Fase 3: Expansión
- [ ] Cache local de templates
- [ ] Templates privadas
- [ ] Plugin system

¿Te parece completa esta especificación? ¿Algo que agregarías o modificarías?