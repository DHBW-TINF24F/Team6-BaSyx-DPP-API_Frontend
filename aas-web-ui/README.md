# aas-web-ui

Scaffolded with Vuetify CLI.

## ❗️ Documentation

- Primary docs: <https://vuetifyjs.com/>
- Getting started guide: <https://vuetifyjs.com/en/getting-started/installation/>
- Community support: <https://community.vuetifyjs.com/>
- Issue tracker: <https://issues.vuetifyjs.com/>

## 🧱 Stack

- Framework: Vue 3 + Vite
- UI Library: Vuetify
- Language: TypeScript
- Package manager: pnpm

## 🧭 Start Here

- Main entry: `src/main.ts`
- Main app component: `src/App.vue`
- Main styles: `src/styles/`
- Plugin setup: `src/plugins/`

## 📁 Project Structure

- `src/main.ts` — application entry point
- `src/App.vue` — root component
- `src/components/` — reusable Vue components
- `src/plugins/` — plugin registration and setup
- `src/styles/` — global styles and theme settings
- `public/` — static public files

## ✨ Enabled Features

- ESLint
- Pinia
- Vuetify MCP
- Vue Router

## 💿 Install

Use your selected package manager (pnpm) to install dependencies:

```bash
pnpm install
```

## 🚀 Quick Start

```bash
pnpm install
pnpm dev
```

## 🏗️ Build

```bash
pnpm build
```

## 🧪 Available Scripts

```
# yarn
yarn lint:check

# npm
npm run lint:check

# pnpm
pnpm lint:check
```

### Fix linting errors

```
# yarn
yarn lint:fix

# npm
npm run lint:fix

# pnpm
pnpm lint:fix
```

### Run the prepared STR integration tests in WSL

The prepared system and integration tests referenced by the STR are located in `tests/integration`.

For a reproducible WSL setup, use Node.js 24 and Yarn via Corepack:

```
corepack enable
yarn install
yarn test:integration
yarn test:coverage
```

### Customize configuration

See [Configuration Reference](https://vitejs.dev/config/).
