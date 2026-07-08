# Dev Runway

Interactive CLI for launching frontend dev environments.

## What It Solves

Dev Runway is for projects that need a small layer above shell commands:

- choose an environment interactively
- run the same `start` or `build` flow across multiple environments
- inject environment and selector values into command args and env vars
- run hooks before or after the main command
- expose project-specific custom commands

It is designed for simple and moderately complex setups. It is not a workflow engine.

## Install

```bash
pnpm add -D dev-runway
```

## Quick Start

```bash
npx dev-runway init
npx dev-runway start
```

## Configuration

Create `runway.config.ts`:

```ts
import type { Config } from 'dev-runway'

export default {
  defaultCommands: {
    start: {
      cmd: 'pnpm',
      args: ['run', 'dev', '--mode', '{{environment.value}}'],
    },
    build: {
      cmd: 'pnpm',
      args: ['run', 'build'],
    },
  },
  environments: [
    { name: 'development', value: 'development', description: 'Development' },
    { name: 'staging', value: 'staging', description: 'Staging' },
    { name: 'production', value: 'production', description: 'Production' },
  ],
} satisfies Partial<Config>
```

## Selectors

Dev Runway supports:

- one optional `globalSelector`
- one optional `localSelector` per environment

Example:

```ts
import type { Config } from 'dev-runway'

export default {
  globalSelector: {
    name: 'platform',
    type: 'selector',
    description: 'Select target platform',
    options: [
      { label: 'Web', value: 'web' },
      { label: 'Desktop', value: 'desktop' },
    ],
  },
  environments: [
    {
      name: 'development',
      value: 'development',
      description: 'Development',
      localSelector: {
        name: 'target',
        type: 'selector',
        description: 'Select build target',
        options: [
          { label: 'ES2019', value: 'es2019' },
          { label: 'ES2022', value: 'es2022' },
        ],
      },
      commands: {
        start: {
          cmd: 'pnpm',
          args: ['run', 'dev', '--platform', '{{selectors.platform}}', '--target', '{{target}}'],
        },
      },
    },
  ],
} satisfies Partial<Config>
```

CLI usage:

```bash
dev-runway start --platform=web --target es2022
```

Both `--selector=value` and `--selector value` are supported.

## Hooks

Hooks can run before or after the main command:

```ts
globalPreHooks: [
  { type: 'command', cmd: 'pnpm', args: ['install'] },
],
globalPostHooks: [
  {
    type: 'function',
    fn: async (environment) => {
      console.log(`${environment.name} is ready`)
    },
  },
]
```

## Template Variables

Available placeholders:

- `{{environment.value}}`
- `{{environment.name}}`
- `{{environment.description}}`
- `{{selectors.foo}}`
- `{{foo}}` as shorthand for selector values

## Non-interactive Usage

```bash
dev-runway build --env production --platform web
```

Or through environment variables:

```bash
export RUNWAY_ENV_VALUE=production
export RUNWAY_SELECTOR_PLATFORM=web
dev-runway build
```

Priority:

1. environment variables
2. command line arguments
3. interactive prompt

## Config Merge Rules

When user config is loaded:

- nested objects are deep-merged
- arrays are replaced
- `environments` always replaces the default environments

This keeps defaults useful while preserving explicit user intent.

## Commands

- `dev-runway start`
- `dev-runway build`
- `dev-runway init`
- `dev-runway list`
- `dev-runway <custom-command>`

## Example Repository Config

See [`examples/web/basic/runway.config.ts`](../examples/web/basic/runway.config.ts).
