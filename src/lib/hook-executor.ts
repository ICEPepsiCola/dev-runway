import chalk from 'chalk'
import ora from 'ora'
import { CommandExecutor, type CommandContext } from './command-executor'
import { RunwayError, ErrorCodes } from './errors'
import type { Hook, Config } from '@/config'
import { replaceTemplateVariables, replaceTemplateEnv } from './template'

export interface HookExecutorOptions {
  verbose?: boolean
  cwd?: string
}

export class HookExecutor {
  private commandExecutor: CommandExecutor
  private verbose: boolean

  constructor(options: HookExecutorOptions = {}) {
    this.verbose = options.verbose || false
    this.commandExecutor = new CommandExecutor({
      verbose: this.verbose,
      cwd: options.cwd,
    })
  }

  async executeHook(hook: Hook, context: CommandContext, config: Config): Promise<void> {
    const hookName = hook.name || `${hook.type} hook`
    const description = hook.description || `执行 ${hookName}`

    if (this.verbose) {
      console.log(chalk.blue(`🪝 ${description}`))
    }

    try {
      if (hook.type === 'command') {
        await this.executeCommandHook(hook, context, description)
      } else if (hook.type === 'function') {
        await this.executeFunctionHook(hook, context, config, description)
      } else {
        throw new RunwayError(`不支持的 hook 类型: ${hook.type}`, ErrorCodes.CONFIG_INVALID)
      }

      if (this.verbose) {
        console.log(chalk.green(`✅ ${description} - 完成`))
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error(chalk.red(`❌ ${description} - 失败: ${errorMsg}`))
      throw new RunwayError(`Hook 执行失败: ${hookName}`, ErrorCodes.COMMAND_FAILED, { hook, originalError: error })
    }
  }

  private async executeCommandHook(
    hook: Hook,
    context: CommandContext,
    description: string,
  ): Promise<void> {
    if (!hook.cmd) {
      throw new RunwayError('Command hook 必须指定 cmd 属性', ErrorCodes.CONFIG_INVALID)
    }

    const args = replaceTemplateVariables(hook.args || [], context)
    const finalEnv = {
      ...process.env,
      ...(hook.env ? replaceTemplateEnv(hook.env, context) : {}),
    }

    await this.commandExecutor.execute(hook.cmd, args, { description, env: finalEnv })
  }

  private async executeFunctionHook(
    hook: Hook,
    context: CommandContext,
    config: Config,
    description: string,
  ): Promise<void> {
    if (!hook.fn) {
      throw new RunwayError('Function hook 必须指定 fn 属性', ErrorCodes.CONFIG_INVALID)
    }

    const spinner = this.verbose ? null : ora(description).start()

    try {
      await hook.fn(context.environment, config)
      spinner?.succeed(chalk.green(`✅ ${description}`))
    } catch (error) {
      spinner?.fail(chalk.red(`❌ ${description}`))
      throw error
    }
  }

  async executeHooks(
    hooks: Hook[],
    context: CommandContext,
    config: Config,
    phase: 'pre' | 'post' = 'pre',
  ): Promise<void> {
    if (!hooks.length) return

    if (this.verbose) {
      console.log(chalk.cyan(`🔗 执行 ${phase} hooks (${hooks.length} 个)`))
    }

    for (const hook of hooks) {
      await this.executeHook(hook, context, config)
    }

    if (this.verbose) {
      console.log(chalk.cyan(`✅ 所有 ${phase} hooks 执行完成`))
    }
  }
}
