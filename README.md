# Dev Runway

Interactive CLI for launching frontend development environments.

Dev Runway helps you:

- choose an environment interactively or non-interactively
- inject environment and selector values into commands
- run pre/post hooks around `start` and `build`
- expose project-specific commands like `lint`, `test`, or `preview`

## Docs

- English: [`docs-src/en.md`](./docs-src/en.md)
- 中文: [`README.zh-CN.md`](./README.zh-CN.md)
- GitHub Pages: [ICEPepsiCola.github.io/dev-runway](https://icepepsicola.github.io/dev-runway/)

## Quick Start

```bash
pnpm add -D dev-runway
npx dev-runway init
npx dev-runway start
```

## Core Design

Dev Runway intentionally keeps the model small:

- `environment`: the target runtime or build target
- `selector`: one global selector and one per-environment local selector
- `command`: actual shell command to execute
- `hook`: command/function that runs before or after the main command

It is designed for simple and moderately complex setups, not workflow engines.

## Example

```ts
import type { Config } from 'dev-runway'

export default {
  globalSelector: {
    name: 'platform',
    type: 'selector',
    description: 'Select platform',
    options: [
      { label: 'Web', value: 'web' },
      { label: 'Desktop', value: 'desktop' },
    ],
  },
  defaultCommands: {
    start: {
      cmd: 'pnpm',
      args: ['run', 'dev', '--mode', '{{environment.value}}'],
      env: {
        APP_PLATFORM: '{{selectors.platform}}',
      },
    },
  },
  environments: [
    { name: 'development', value: 'development', description: 'Development' },
    { name: 'production', value: 'production', description: 'Production' },
  ],
} satisfies Partial<Config>
```

## Commands

- `dev-runway start`
- `dev-runway build`
- `dev-runway init`
- `dev-runway list`
- `dev-runway <custom-command>`

## License

ISC
