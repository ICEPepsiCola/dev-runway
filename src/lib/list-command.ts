import chalk from 'chalk'
import type { Config, Environment } from '@/config'

/**
 * 列出命令选项
 */
export interface ListOptions {
  json?: boolean
  verbose?: boolean
}

/**
 * 列出环境命令执行器
 */
export class ListCommand {
  constructor(private config: Config, private options: ListOptions = {}) { }

  /**
   * 执行列出环境命令
   */
  execute(): void {
    const { environments } = this.config

    // 如果没有环境，显示提示信息
    if (!environments || environments.length === 0) {
      console.log(chalk.yellow('⚠️ 没有找到任何环境配置'))
      return
    }

    // JSON 格式输出
    if (this.options.json) {
      this.outputJson(environments)
      return
    }

    // 标准格式输出
    this.outputStandard(environments)
  }

  /**
   * 以 JSON 格式输出环境列表
   */
  private outputJson(environments: Environment[]): void {
    const result = environments.map((env) => ({
      name: env.name,
      value: env.value,
      description: env.description,
      hasCommands: !!env.commands,
      hasLocalSelector: !!env.localSelector,
    }))

    console.log(JSON.stringify(result, null, 2))
  }

  /**
   * 以标准格式输出环境列表
   */
  private outputStandard(environments: Environment[]): void {
    console.log(chalk.bold('\n可用环境:\n'))

    // 找出最长的环境名称，用于对齐
    const maxNameLength = Math.max(...environments.map((env) => env.name.length))

    // 输出每个环境
    environments.forEach((env) => {
      const padding = ' '.repeat(maxNameLength - env.name.length + 2)
      const name = chalk.green(`• ${env.name}`)
      const description = env.description ? chalk.gray(`- ${env.description}`) : ''

      console.log(`${name}${padding}${description}`)

      // 如果启用了详细模式，显示更多信息
      if (this.options.verbose) {
        const indent = ' '.repeat(maxNameLength + 4)
        console.log(`${indent}${chalk.blue('值:')} ${env.value}`)

        if (env.commands) {
          console.log(`${indent}${chalk.blue('命令:')} ${Object.keys(env.commands).join(', ')}`)
        }

        if (env.localSelector) {
          console.log(`${indent}${chalk.blue('局部选择器:')} ${env.localSelector.name}`)
        }

        console.log() // 添加一个空行
      }
    })

    // 显示全局选择器信息
    if (this.config.globalSelector && this.options.verbose) {
      console.log(chalk.bold('\n全局选择器:\n'))
      console.log(`${chalk.green('• 名称:')} ${this.config.globalSelector.name}`)
      console.log(`${chalk.green('• 描述:')} ${this.config.globalSelector.description}`)
      console.log(`${chalk.green('• 选项:')} ${this.config.globalSelector.options.map((opt) => opt.label).join(', ')}`)
    }

    console.log('\n使用 ' + chalk.cyan('dev-runway start') + ' 启动开发服务器')
    console.log('使用 ' + chalk.cyan('dev-runway build') + ' 构建项目')
    console.log('使用 ' + chalk.cyan('dev-runway --help') + ' 查看更多帮助信息\n')
  }
}

/**
 * 执行列出环境命令
 */
export async function executeListCommand(config: Config, options: ListOptions = {}): Promise<void> {
  const listCommand = new ListCommand(config, options)
  listCommand.execute()
}
