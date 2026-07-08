// 核心子命令类型定义
export type CoreSubcommandType = 'start' | 'build' | 'init' | 'list'

// 子命令类型定义，支持自定义命令
export type SubcommandType = CoreSubcommandType | string

export interface SelectorOption {
  label: string
  value: string
}

export interface Hook {
  name?: string
  description?: string
  type: 'command' | 'function'
  cmd?: string
  args?: string[]
  env?: Record<string, string>
  fn?: (environment: Environment, config: Config) => Promise<void> | void
}

export interface CommandConfig {
  cmd: string
  args: string[]
  env?: Record<string, string>
}

export interface SelectorConfig {
  type: 'selector'
  name: string
  description: string
  options: SelectorOption[]
  appliesTo?: SubcommandType[]
}

/** @deprecated 使用 SelectorConfig */
export type GlobalSelector = SelectorConfig

export interface Environment {
  name: string
  value: string
  description: string
  localSelector?: SelectorConfig
  commands?: {
    start?: CommandConfig
    build?: CommandConfig
    [key: string]: CommandConfig | undefined
  }
  preHooks?: Hook[]
  postHooks?: Hook[]
}

export interface Config {
  environments: Environment[]
  globalSelector?: SelectorConfig
  defaultCommands?: {
    start?: CommandConfig
    build?: CommandConfig
    [key: string]: CommandConfig | undefined
  }
  customCommands?: {
    [key: string]: CommandConfig
  }
  globalPreHooks?: Hook[]
  globalPostHooks?: Hook[]
}

export const defaultConfig: Config = {
  defaultCommands: {
    start: {
      cmd: 'npx',
      args: ['vite', '--mode', '{{environment.value}}', '--host'],
      env: {
        DEBUG: 'true',
        NODE_ENV: 'development',
      },
    },
    build: {
      cmd: 'npx',
      args: ['vite', 'build', '--mode', '{{environment.value}}'],
      env: {
        NODE_ENV: 'production',
      },
    },
  },
  environments: [
    { name: 'development', value: 'development', description: '开发环境' },
    { name: 'test', value: 'test', description: '测试环境' },
    { name: 'hotfix', value: 'hotfix', description: '热修复环境' },
    { name: 'release', value: 'release', description: '预发布环境' },
    { name: 'production', value: 'production', description: '生产环境' },
  ],
}
