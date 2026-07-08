import inquirer from 'inquirer'
import { RunwayError, ErrorCodes } from '@/lib/errors'
import { type Config, type Environment } from '@/config'

export class EnvironmentManager {
  private environments: Environment[]

  constructor(config: Config) {
    this.environments = config.environments || []
    this.validateEnvironments()
  }

  /**
   * 验证环境配置
   */
  validateEnvironments(): void {
    if (!Array.isArray(this.environments)) {
      throw new RunwayError(
        '环境配置必须是数组',
        ErrorCodes.CONFIG_INVALID,
      )
    }

    if (this.environments.length === 0) {
      throw new RunwayError(
        '至少需要配置一个环境',
        ErrorCodes.CONFIG_INVALID,
      )
    }

    // 检查重复的环境值
    const values = this.environments.map((env: Environment) => env.value)
    const duplicates = values.filter(
      (value: string, index: number) => values.indexOf(value) !== index,
    )

    if (duplicates.length > 0) {
      throw new RunwayError(
        `发现重复的环境值: ${duplicates.join(', ')}`,
        ErrorCodes.CONFIG_INVALID,
      )
    }

    // 验证每个环境的必要字段
    this.environments.forEach((env: Environment, index: number) => {
      if (!env.name || typeof env.name !== 'string') {
        throw new RunwayError(
          `环境 [${index}] 缺少有效的 name 字段`,
          ErrorCodes.CONFIG_INVALID,
        )
      }

      if (!env.value || typeof env.value !== 'string') {
        throw new RunwayError(
          `环境 [${index}] 缺少有效的 value 字段`,
          ErrorCodes.CONFIG_INVALID,
        )
      }

      if (!env.description || typeof env.description !== 'string') {
        throw new RunwayError(
          `环境 [${index}] 缺少有效的 description 字段`,
          ErrorCodes.CONFIG_INVALID,
        )
      }
    })
  }

  /**
   * 获取所有环境
   */
  getAll(): Environment[] {
    return [...this.environments]
  }

  /**
   * 根据值获取环境
   */
  getByValue(value: string): Environment | undefined {
    return this.environments.find((env: Environment) => env.value === value)
  }

  /**
   * 根据名称获取环境
   */
  getByName(name: string): Environment | undefined {
    return this.environments.find((env: Environment) => env.name === name)
  }

  /**
   * 验证环境值是否有效
   */
  validate(value: string): boolean {
    return this.getByValue(value) !== undefined
  }

  /**
   * 获取环境值列表
   */
  getValues(): string[] {
    return this.environments.map((env: Environment) => env.value)
  }

  /**
   * 获取环境名称列表
   */
  getNames(): string[] {
    return this.environments.map((env: Environment) => env.name)
  }

  /**
   * 获取用于inquirer选择的格式化选项
   */
  getInquirerChoices(): Array<{ name: string; value: Environment; short: string }> {
    return this.environments.map((env: Environment) => ({
      name: `${env.name} - ${env.description}`,
      value: env,
      short: env.name,
    }))
  }
}

/**
 * 交互式环境选择函数
 */
export async function selectEnvironment(environments: Environment[]): Promise<Environment> {
  const choices = environments.map((env: Environment) => ({
    name: `${env.name} - ${env.description}`,
    value: env,
  }))

  const { selectedEnv } = await inquirer.prompt([{
    type: 'list',
    name: 'selectedEnv',
    message: '请选择环境:',
    choices,
  }])

  return selectedEnv
}
