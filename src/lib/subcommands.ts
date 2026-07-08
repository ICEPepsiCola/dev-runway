import chalk from 'chalk'
import { Command } from 'commander'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import {
  ConfigManager,
  EnvironmentManager,
  selectEnvironment,
  executeInitCommand,
  executeListCommand,
} from '@/lib'
import { executeCommand, CommandExecutor } from './command-executor'
import { SelectorExecutor } from './selector-executor'
import { shouldApplySelector, resolveSelectorValue } from './selector-utils'
import type { SubcommandType, Config, CommandConfig } from '@/config'
import { getSubcommandDescription } from './utils'

export interface SubcommandOptions {
  env?: string
  api?: string
  verbose?: boolean
  selectors?: Record<string, string>
  config?: string
  force?: boolean
  template?: string
  json?: boolean
}

export class SubcommandManager {
  private program: Command
  private customCommands = new Map<string, CommandConfig>()
  private loadedConfig: Config | null = null
  private configPath: string | undefined
  private readonly selectorExecutor = new SelectorExecutor()

  constructor() {
    this.program = new Command()
    this.setupProgram()
  }

  private static readonly KNOWN_OPTIONS = new Set(['env', 'api', 'verbose', 'config'])

  private parseSelectorArgsFromArgv(rawArgs: string[]): Record<string, string> {
    const selectors: Record<string, string> = {}
    for (let index = 0; index < rawArgs.length; index++) {
      const arg = rawArgs[index]
      if (!arg.startsWith('--')) continue

      if (arg.includes('=')) {
        const [name, value] = arg.substring(2).split('=')
        if (!SubcommandManager.KNOWN_OPTIONS.has(name) && value) {
          selectors[name] = value
        }
        continue
      }

      const name = arg.substring(2)
      const nextArg = rawArgs[index + 1]
      if (
        !SubcommandManager.KNOWN_OPTIONS.has(name)
        && nextArg
        && !nextArg.startsWith('--')
      ) {
        selectors[name] = nextArg
        index += 1
      }
    }
    return selectors
  }

  private createRuntimeCommandHandler(subcommand: SubcommandType) {
    return async (options: SubcommandOptions, command: Command): Promise<void> => {
      const globalOptions = this.program.opts()
      await this.executeSubcommand(subcommand, {
        ...globalOptions,
        ...options,
        env: options.env ?? globalOptions.env ?? globalOptions.api,
        selectors: {
          ...this.parseSelectorArgsFromArgv((command.parent as Command & { rawArgs?: string[] })?.rawArgs ?? []),
          ...(options.selectors ?? {}),
        },
      })
    }
  }

  async loadConfig(configPath?: string): Promise<Config> {
    if (this.loadedConfig && this.configPath === configPath) {
      return this.loadedConfig
    }

    const config = await ConfigManager.load(process.cwd(), configPath)
    this.loadedConfig = config
    this.configPath = configPath
    this.registerCustomCommands(config)
    return config
  }

  registerCustomCommands(config: Config): void {
    this.customCommands.clear()
    if (!config.customCommands) return

    for (const [name, commandConfig] of Object.entries(config.customCommands)) {
      if (['start', 'build', 'init', 'list'].includes(name)) {
        console.warn(chalk.yellow(`⚠️  警告: 自定义命令 "${name}" 与内置命令冲突，将被忽略`))
        continue
      }

      this.customCommands.set(name, commandConfig)
      this.program
        .command(name)
        .description(`自定义命令: ${name}`)
        .option('--verbose', '显示详细输出')
        .allowUnknownOption(true)
        .action(async (options: SubcommandOptions) => {
          const globalOptions = this.program.opts()
          await this.executeCustomCommand(name, { ...globalOptions, ...options })
        })
    }
  }

  private setupProgram(): void {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    let version = '1.0.0'
    try {
      version = JSON.parse(readFileSync(join(currentDir, '../package.json'), 'utf8')).version
    } catch { /* use default */ }

    this.program
      .name('dev-runway')
      .description('交互式前端开发环境启动器')
      .version(version, '-v, --version', '显示版本信息')

    const runtimeOpts = [
      ['--env <value>', '指定环境值'],
      ['--api <value>', '指定环境值（已弃用）'],
      ['--verbose', '显示详细输出'],
    ] as const

    for (const sub of ['start', 'build'] as const) {
      this.program
        .command(sub)
        .description(sub === 'start' ? '启动开发服务器' : '构建项目')
        .option(...runtimeOpts[0])
        .option(...runtimeOpts[1])
        .option(...runtimeOpts[2])
        .allowUnknownOption(true)
        .action(this.createRuntimeCommandHandler(sub))
    }

    this.program
      .command('init')
      .description('初始化配置文件')
      .option('--force', '强制覆盖现有配置文件')
      .option('--template <type>', '指定模板类型 (vite|webpack|nextjs)', 'vite')
      .action(async (options: SubcommandOptions) => {
        await this.executeSubcommand('init', { ...this.program.opts(), ...options })
      })

    this.program
      .command('list')
      .description('列出所有可用环境')
      .option('--json', '以 JSON 格式输出')
      .action(async (options: SubcommandOptions) => {
        await this.executeSubcommand('list', { ...this.program.opts(), ...options })
      })

    this.program
      .option('--env <value>', '指定环境值')
      .option('--api <value>', '指定环境值（已弃用）')
      .option('--verbose', '显示详细输出')
      .option('--config <path>', '指定配置文件路径')
  }

  async executeCustomCommand(commandName: string, options: SubcommandOptions): Promise<void> {
    try {
      const config = await ConfigManager.load(process.cwd(), options.config)
      const commandConfig = this.customCommands.get(commandName) || config.customCommands?.[commandName]
      if (!commandConfig) throw new Error(`未找到自定义命令: ${commandName}`)

      console.log(chalk.green(`🚀 执行自定义命令: ${commandName}`))
      const executor = new CommandExecutor({ verbose: options.verbose ?? false })
      await executor.execute(commandConfig.cmd, commandConfig.args || [], {
        description: `执行自定义命令 ${commandName}`,
        env: { ...process.env, ...(commandConfig.env || {}) },
      })
    } catch (error) {
      console.error(chalk.red('错误:'), error instanceof Error ? error.message : String(error))
      process.exit(1)
    }
  }

  async executeSubcommand(subcommand: SubcommandType, options: SubcommandOptions): Promise<void> {
    try {
      const config = await this.loadConfig(options.config)

      if (subcommand === 'init') {
        await executeInitCommand({
          force: options.force,
          template: options.template,
          verbose: options.verbose,
        })
        return
      }

      if (subcommand === 'list') {
        executeListCommand(config, { json: options.json, verbose: options.verbose })
        return
      }

      const selectors: Record<string, string> = { ...(options.selectors ?? {}) }

      if (config.globalSelector && shouldApplySelector(config.globalSelector, subcommand)) {
        selectors[config.globalSelector.name] = await resolveSelectorValue(
          config.globalSelector,
          options.selectors,
          this.selectorExecutor,
        )
      }

      const environmentManager = new EnvironmentManager(config)
      const specifiedEnv = options.env ?? options.api
      let environment

      if (process.env.RUNWAY_ENV_VALUE) {
        environment = environmentManager.getByValue(process.env.RUNWAY_ENV_VALUE)
        if (!environment) {
          console.error(chalk.red(`错误: RUNWAY_ENV_VALUE="${process.env.RUNWAY_ENV_VALUE}" 指定的环境不存在`))
          console.log(chalk.yellow('可用环境:'), environmentManager.getValues().join(', '))
          process.exit(1)
        }
        console.log(chalk.blue(`使用环境变量指定的环境: ${environment.name}`))
      } else if (specifiedEnv) {
        environment = environmentManager.getByValue(specifiedEnv)
        if (!environment) {
          console.error(chalk.red(`错误: 不支持的环境 "${specifiedEnv}"`))
          console.log(chalk.yellow('可用环境:'), environmentManager.getValues().join(', '))
          process.exit(1)
        }
        console.log(chalk.blue(`使用环境: ${environment.name}`))
      } else {
        environment = await selectEnvironment(environmentManager.getAll())
      }

      if (environment.localSelector && shouldApplySelector(environment.localSelector, subcommand)) {
        selectors[environment.localSelector.name] = await resolveSelectorValue(
          environment.localSelector,
          options.selectors,
          this.selectorExecutor,
        )
      }

      const selectorSummary = Object.entries(selectors)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ')
      const extra = selectorSummary ? ` (${selectorSummary})` : ''
      console.log(chalk.green(`🚀 ${getSubcommandDescription(subcommand)} ${environment.name} 环境${extra}...`))

      await executeCommand(subcommand, environment, config, {
        verbose: options.verbose ?? false,
        selectors,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(chalk.red('错误:'), errorMessage)
      if (errorMessage.includes('ENOENT')) {
        console.log(chalk.yellow('提示: 请确保已安装相关依赖'))
        console.log(chalk.gray('运行: pnpm install'))
      }
      process.exit(1)
    }
  }

  parse(argv: string[] = process.argv): void {
    const configIndex = argv.findIndex((arg) => arg === '--config')
    const configPath = configIndex !== -1 && configIndex + 1 < argv.length
      ? argv[configIndex + 1]
      : undefined

    this.loadConfig(configPath)
      .then(() => this.program.parse(argv))
      .catch((error) => {
        console.error(chalk.yellow(`警告: 配置文件加载失败，将使用默认配置: ${error.message}`))
        this.program.parse(argv)
      })
  }
}

export const subcommandManager = new SubcommandManager()
