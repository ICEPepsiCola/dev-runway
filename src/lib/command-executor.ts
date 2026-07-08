import { spawn, type SpawnOptions } from 'child_process'
import chalk from 'chalk'
import ora, { type Ora } from 'ora'
import { RunwayError, ErrorCodes } from '@/lib/errors'
import { type Environment, type Config, type CommandConfig } from '@/config'
import { HookExecutor } from './hook-executor'
import type { SubcommandType } from '@/config'
import { getSubcommandDescription } from './utils'
import { replaceTemplateString, replaceTemplateVariables, replaceTemplateEnv } from './template'

export interface CommandContext {
  environment: Environment
  selectors: Record<string, string>
}

interface CommandExecutorOptions {
  verbose?: boolean
  cwd?: string
}

interface ExecuteOptions extends SpawnOptions {
  description?: string
}

export class CommandExecutor {
  private verbose: boolean
  private cwd: string
  private spinner: Ora | null

  constructor(options: CommandExecutorOptions = {}) {
    this.verbose = options.verbose || false
    this.cwd = options.cwd || process.cwd()
    this.spinner = null
  }

  async execute(cmd: string, args: string[] = [], options: ExecuteOptions = {}): Promise<number> {
    const finalOptions: SpawnOptions = {
      cwd: this.cwd,
      stdio: this.verbose ? 'inherit' : 'pipe',
      shell: process.platform === 'win32',
      ...options,
    }

    const description = options.description || `执行 ${cmd} ${args.join(' ')}`

    if (this.verbose) {
      console.log(chalk.blue(`🔧 ${description}`))
      console.log(chalk.gray(`   命令: ${cmd} ${args.join(' ')}`))
      console.log(chalk.gray(`   目录: ${finalOptions.cwd}`))
    } else {
      this.spinner = ora(description).start()
    }

    try {
      const exitCode = await this.spawnCommand(cmd, args, finalOptions)

      if (exitCode === 0) {
        if (this.spinner) {
          this.spinner.succeed(chalk.green(`✅ ${description}`))
        } else if (this.verbose) {
          console.log(chalk.green(`✅ ${description} - 完成`))
        }
      } else {
        const errorMsg = `${description} - 失败 (退出码: ${exitCode})`
        if (this.spinner) {
          this.spinner.fail(chalk.red(`❌ ${errorMsg}`))
        } else {
          console.error(chalk.red(`❌ ${errorMsg}`))
        }

        throw new RunwayError(
          `命令执行失败: ${cmd} ${args.join(' ')}`,
          ErrorCodes.COMMAND_FAILED,
          { cmd, args, exitCode, cwd: finalOptions.cwd },
        )
      }

      return exitCode
    } catch (error) {
      if (this.spinner) {
        this.spinner.fail(chalk.red(`❌ ${description} - 错误`))
      }

      if (error instanceof RunwayError) {
        throw error
      }

      throw new RunwayError(
        `命令执行异常: ${error instanceof Error ? error.message : String(error)}`,
        ErrorCodes.COMMAND_FAILED,
        { cmd, args, originalError: error, cwd: finalOptions.cwd },
      )
    }
  }

  spawnCommand(cmd: string, args: string[], options: SpawnOptions): Promise<number> {
    return new Promise((resolve, reject) => {
      if (this.verbose) {
        console.log(chalk.blue(`执行命令: ${cmd} ${args.join(' ')}`))
      }

      const child = spawn(cmd, args, options)
      let stderr = ''
      let stdout = ''

      child.stdout?.on('data', (data) => {
        stdout += data.toString()
        if (this.verbose) process.stdout.write(data)
      })

      child.stderr?.on('data', (data) => {
        stderr += data.toString()
        if (this.verbose) process.stderr.write(data)
      })

      child.on('error', (error) => {
        reject(new Error(`进程启动失败: ${error.message}`))
      })

      child.on('close', (code) => {
        if (code !== 0) {
          if (stderr) {
            console.error(chalk.red(stderr))
          } else if (stdout) {
            console.error(chalk.yellow('命令输出:'))
            console.error(stdout)
          }
        }
        resolve(code || 0)
      })
    })
  }
}

function getEnvironmentCommand(
  environment: Environment,
  subcommand: SubcommandType,
): CommandConfig | undefined {
  return environment.commands?.[subcommand]
}

function getDefaultCommand(config: Config, subcommand: SubcommandType): CommandConfig | undefined {
  return config.defaultCommands?.[subcommand]
}

function getBuiltinDefaultCommand(subcommand: SubcommandType): CommandConfig {
  switch (subcommand) {
    case 'start':
      return { cmd: 'npx', args: ['vite', '--mode', '{{environment.value}}', '--host'] }
    case 'build':
      return { cmd: 'npx', args: ['vite', 'build', '--mode', '{{environment.value}}'] }
    default:
      throw new RunwayError(`不支持的子命令: ${subcommand}`, ErrorCodes.CONFIG_INVALID)
  }
}

export async function executeCommand(
  subcommand: SubcommandType,
  environment: Environment,
  config: Config,
  options: { verbose?: boolean; selectors?: Record<string, string> } = {},
): Promise<number> {
  const executor = new CommandExecutor({ verbose: options.verbose ?? false })
  const hookExecutor = new HookExecutor({ verbose: options.verbose ?? false })
  const templateContext: CommandContext = {
    environment,
    selectors: options.selectors ?? {},
  }

  try {
    if (config.globalPreHooks) {
      await hookExecutor.executeHooks(config.globalPreHooks, templateContext, config, 'pre')
    }

    if (environment.preHooks) {
      await hookExecutor.executeHooks(environment.preHooks, templateContext, config, 'pre')
    }

    const command = getEnvironmentCommand(environment, subcommand)
      || getDefaultCommand(config, subcommand)
      || getBuiltinDefaultCommand(subcommand)

    if (options.verbose) {
      console.log(chalk.cyan('\n📋 执行上下文:'))
      console.log(chalk.gray('─'.repeat(50)))
      console.log(chalk.blue(`🌍 环境: ${environment.name} (${environment.value})`))
      if (Object.keys(templateContext.selectors).length > 0) {
        Object.entries(templateContext.selectors).forEach(([name, value]) => {
          console.log(chalk.green(`🎯 ${name}: ${value}`))
        })
      }
      console.log(chalk.gray('─'.repeat(50)))
    }

    const processedCmd = replaceTemplateString(command.cmd, templateContext)
    const processedArgs = replaceTemplateVariables(command.args, templateContext)

    if (options.verbose) {
      console.log(chalk.magenta(`\n🚀 最终命令: ${processedCmd} ${processedArgs.join(' ')}\n`))
    }

    const finalEnv = {
      ...process.env,
      ...(command.env ? replaceTemplateEnv(command.env, templateContext) : {}),
    }

    const exitCode = await executor.execute(processedCmd, processedArgs, {
      description: `${getSubcommandDescription(subcommand)} ${environment.name} 环境`,
      env: finalEnv,
    })

    if (environment.postHooks) {
      await hookExecutor.executeHooks(environment.postHooks, templateContext, config, 'post')
    }

    if (config.globalPostHooks) {
      await hookExecutor.executeHooks(config.globalPostHooks, templateContext, config, 'post')
    }

    return exitCode
  } catch (error) {
    if (error instanceof RunwayError) throw error

    throw new RunwayError(
      `命令执行失败: ${error instanceof Error ? error.message : String(error)}`,
      ErrorCodes.COMMAND_FAILED,
      { environment, subcommand, originalError: error },
    )
  }
}
