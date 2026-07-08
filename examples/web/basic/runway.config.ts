import type { Config } from 'dev-runway'

export default {
  defaultCommands: {
    start: {
      cmd: 'pnpm',
      args: ['run', 'dev'],
      env: { NODE_ENV: 'development' },
    },
    build: {
      cmd: 'pnpm',
      args: ['run', 'build'],
      env: { NODE_ENV: 'production' },
    },
  },
  globalSelector: {
    name: 'platform',
    type: 'selector',
    description: '选择目标平台',
    options: [
      { label: 'Web', value: 'web' },
      { label: 'Desktop', value: 'desktop' },
    ],
  },
  environments: [
    {
      name: 'development',
      value: 'development',
      description: '开发环境',
      commands: {
        start: {
          cmd: 'pnpm',
          args: ['run', 'dev', '--mode', '{{environment.value}}'],
          env: {
            VITE_API_BASE_URL: 'https://dev-api.example.com',
            VITE_PLATFORM: '{{selectors.platform}}',
          },
        },
      },
    },
    {
      name: 'production',
      value: 'production',
      description: '生产环境',
      commands: {
        build: {
          cmd: 'pnpm',
          args: ['run', 'build'],
          env: {
            VITE_API_BASE_URL: 'https://api.example.com',
            VITE_PLATFORM: '{{selectors.platform}}',
          },
        },
      },
    },
  ],
  customCommands: {
    lint: { cmd: 'pnpm', args: ['run', 'lint'] },
    test: { cmd: 'pnpm', args: ['run', 'test'] },
  },
} satisfies Partial<Config>
