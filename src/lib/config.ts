import { join } from 'path'
import { defaultConfig, type Config } from '@/config'
import { RunwayError, ErrorCodes } from '@/lib/errors'
import chalk from 'chalk'
import { createJiti } from 'jiti'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function mergeConfigValue<T>(base: T, override: T): T {
  if (override === undefined) {
    return base
  }

  if (Array.isArray(base) || Array.isArray(override)) {
    return override
  }

  if (isPlainObject(base) && isPlainObject(override)) {
    const merged: Record<string, unknown> = { ...base }
    for (const [key, value] of Object.entries(override)) {
      merged[key] = key in merged
        ? mergeConfigValue(merged[key], value)
        : value
    }
    return merged as T
  }

  return override
}

export class ConfigManager {
  static async load(searchFrom: string = process.cwd(), configPath?: string): Promise<Config> {
    if (configPath) {
      try {
        console.log(chalk.blue(`尝试加载指定的配置文件: ${configPath}`))
        const config = await this.loadConfigFromPath(configPath)
        this.validate(config)
        console.log(chalk.green(`✅ 成功加载配置文件: ${configPath}`))
        return this.mergeConfigs(defaultConfig, config)
      } catch (error) {
        console.error(chalk.red(`❌ 加载配置文件失败: ${configPath}`))
        console.error(chalk.red(error instanceof Error ? error.message : String(error)))
        process.exit(1)
      }
    }

    const externalConfig = await this.loadExternalConfig(searchFrom)
    if (externalConfig) {
      return this.mergeConfigs(defaultConfig, externalConfig)
    }

    console.log(chalk.blue('使用默认配置'))
    return this.mergeConfigs(defaultConfig, {})
  }

  private static async loadConfigFromPath(configPath: string): Promise<Partial<Config>> {
    if (configPath.endsWith('.ts')) {
      return this.loadTypeScriptConfig(configPath)
    }

    const mod = await import(configPath)
    return mod.default as Partial<Config>
  }

  private static async loadExternalConfig(searchFrom: string): Promise<Partial<Config> | null> {
    for (const configFile of ['runway.config.ts', 'runway.config.js', 'runway.config.mjs']) {
      try {
        const configPath = join(searchFrom, configFile)
        console.log(chalk.blue(`尝试加载配置文件: ${configFile}`))

        const config = configFile.endsWith('.ts')
          ? await this.loadTypeScriptConfig(configPath)
          : (await import(configPath)).default as Config

        this.validate(config)
        console.log(chalk.green(`✅ 成功加载配置文件: ${configFile}`))
        return config
      } catch {
        continue
      }
    }

    return null
  }

  private static async loadTypeScriptConfig(configPath: string): Promise<Config> {
    try {
      const jiti = createJiti(process.cwd(), {
        interopDefault: true,
        debug: false,
        fsCache: true,
      })
      return await jiti.import<Config>(configPath, { default: true })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(
        `加载 TypeScript 配置文件失败: ${errorMessage}\n\n` +
        '请确保:\n1. 配置文件语法正确\n2. 所有依赖已安装',
      )
    }
  }

  private static mergeConfigs(base: Config, user: Partial<Config>): Config {
    const merged = mergeConfigValue(base, user) as Config
    if (user.environments) {
      merged.environments = [...user.environments]
    }
    return merged
  }

  static validate(config: unknown): void {
    if (!config || typeof config !== 'object') {
      throw new RunwayError('配置文件必须导出一个对象', ErrorCodes.CONFIG_INVALID)
    }

    const configObj = config as Record<string, unknown>

    if (configObj.environments) {
      if (!Array.isArray(configObj.environments)) {
        throw new RunwayError('environments 必须是数组', ErrorCodes.CONFIG_INVALID)
      }

      configObj.environments.forEach((env: unknown, index: number) => {
        const envObj = env as Record<string, unknown>
        if (!envObj.name || !envObj.value || !envObj.description) {
          throw new RunwayError(
            `环境配置 [${index}] 缺少必要字段: name, value, description`,
            ErrorCodes.CONFIG_INVALID,
          )
        }
      })
    }

    this.validateSelectors(configObj as unknown as Config)
  }

  private static validateSelectors(config: Config): void {
    const selectorNames = new Set<string>()

    if (config.globalSelector) {
      if (!config.globalSelector.name) {
        throw new RunwayError('全局选择器必须指定 name 属性', ErrorCodes.CONFIG_INVALID)
      }
      selectorNames.add(config.globalSelector.name)
    }

    config.environments?.forEach((env) => {
      if (!env.localSelector) return

      if (!env.localSelector.name) {
        throw new RunwayError(
          `环境 "${env.name}" 的局部选择器必须指定 name 属性`,
          ErrorCodes.CONFIG_INVALID,
        )
      }

      if (selectorNames.has(env.localSelector.name)) {
        console.warn(chalk.yellow(
          `⚠️  警告: 环境 "${env.name}" 的局部选择器名称 "${env.localSelector.name}" 与其他选择器名称冲突`,
        ))
      } else {
        selectorNames.add(env.localSelector.name)
      }
    })
  }

  static getDefaultConfig(): Config {
    return { ...defaultConfig }
  }
}
