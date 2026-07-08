import fs from 'fs'
import path from 'path'
import chalk from 'chalk'
import inquirer from 'inquirer'

// 模板类型
export type TemplateType = 'vite' | 'webpack' | 'nextjs'

// 初始化选项
export interface InitOptions {
  force?: boolean
  template?: string
  verbose?: boolean
}

// 配置问题
interface ConfigQuestions {
  projectType: string
  useTypeScript: boolean
  useSelectors: boolean
  platformType?: string
  environments: string[]
}

/**
 * 初始化命令执行器
 */
export class InitCommand {
  private readonly configFileName = 'runway.config.ts'
  private readonly configPath: string

  constructor(private options: InitOptions = {}) {
    // 配置文件路径 (当前工作目录)
    this.configPath = path.join(process.cwd(), this.configFileName)
  }

  /**
   * 执行初始化命令
   */
  async execute(): Promise<void> {
    console.log(chalk.blue('🚀 初始化 Dev Runway 配置文件...'))

    // 检查配置文件是否已存在
    if (fs.existsSync(this.configPath) && !this.options.force) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `配置文件 ${this.configFileName} 已存在，是否覆盖？`,
          default: false,
        },
      ])

      if (!overwrite) {
        console.log(chalk.yellow('⚠️ 操作已取消'))
        return
      }
    }

    // 收集配置信息
    const answers = await this.promptQuestions()

    // 生成配置文件内容
    const configContent = this.generateConfigContent(answers)

    // 写入配置文件
    fs.writeFileSync(this.configPath, configContent)

    console.log(chalk.green(`✅ 配置文件已创建: ${this.configPath}`))
    console.log(chalk.blue('📝 现在你可以运行以下命令来启动项目:'))
    console.log(chalk.cyan('  npx dev-runway start'))
  }

  /**
   * 提示用户回答配置问题
   */
  private async promptQuestions(): Promise<ConfigQuestions> {
    // 如果指定了模板，则使用模板预设
    if (this.options.template) {
      return this.getTemplatePreset(this.options.template as TemplateType)
    }

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'projectType',
        message: '你的项目使用什么构建工具？',
        choices: [
          { name: 'Vite', value: 'vite' },
          { name: 'Webpack', value: 'webpack' },
          { name: 'Next.js', value: 'nextjs' },
          { name: '自定义', value: 'custom' },
        ],
        default: 'vite',
      },
      {
        type: 'confirm',
        name: 'useSelectors',
        message: '是否需要配置选择器（用于多平台开发）？',
        default: false,
      },
      {
        type: 'checkbox',
        name: 'platformType',
        message: '选择需要支持的平台类型:',
        choices: [
          { name: 'Web', value: 'web' },
          { name: 'Android', value: 'android' },
          { name: 'iOS', value: 'ios' },
          { name: '小程序', value: 'miniapp' },
        ],
        when: (answers): boolean => answers.useSelectors,
        validate: (input): boolean | string => (input.length > 0 ? true : '请至少选择一个平台'),
      },
      {
        type: 'checkbox',
        name: 'environments',
        message: '选择需要的环境:',
        choices: [
          { name: '开发环境 (development)', value: 'development', checked: true },
          { name: '测试环境 (test)', value: 'test', checked: true },
          { name: '热修复环境 (hotfix)', value: 'hotfix' },
          { name: '生产环境 (production)', value: 'production', checked: true },
        ],
        validate: (input): boolean | string => (input.length > 0 ? true : '请至少选择一个环境'),
      },
    ])

    return {
      ...answers,
      useTypeScript: true, // 默认使用 TypeScript
    }
  }

  /**
   * 根据模板类型获取预设配置
   */
  private getTemplatePreset(templateType: TemplateType): ConfigQuestions {
    switch (templateType) {
      case 'vite':
        return {
          projectType: 'vite',
          useTypeScript: true,
          useSelectors: false,
          environments: ['development', 'test', 'production'],
        }
      case 'webpack':
        return {
          projectType: 'webpack',
          useTypeScript: true,
          useSelectors: false,
          environments: ['development', 'test', 'production'],
        }
      case 'nextjs':
        return {
          projectType: 'nextjs',
          useTypeScript: true,
          useSelectors: false,
          environments: ['development', 'production'],
        }
      default:
        throw new Error(`不支持的模板类型: ${templateType}`)
    }
  }

  /**
   * 生成配置文件内容
   */
  private generateConfigContent(answers: ConfigQuestions): string {
    const {
      projectType, useSelectors, platformType, environments,
    } = answers

    // 基础导入
    let content = 'import type { Config } from "dev-runway";\n\n'

    // 添加注释
    content += `/**
 * Dev Runway 配置文件
 *
 * 该文件定义了项目的环境配置和命令执行方式
 * 详细文档: https://github.com/ICEPepsiCola/dev-runway
 */\n\n`

    // 开始配置对象
    content += 'export default {\n'

    // 添加默认命令配置
    content += this.generateDefaultCommands(projectType)

    // 添加选择器配置
    if (useSelectors && platformType) {
      content += this.generateSelectorConfig(platformType)
    }

    // 添加环境配置
    content += this.generateEnvironments(environments, projectType, useSelectors)

    // 结束配置对象
    content += '} satisfies Partial<Config>;\n'

    return content
  }

  /**
   * 生成默认命令配置
   */
  private generateDefaultCommands(projectType: string): string {
    let commands = `  /**
   * 默认命令配置 - 所有环境都会使用这些命令（除非环境自定义了命令）
   */
  defaultCommands: {\n`

    switch (projectType) {
      case 'vite':
        commands += `    start: {
      cmd: "npx",
      args: ["vite", "--mode", "{{environment.value}}", "--host"],
    },
    build: {
      cmd: "npx",
      args: ["vite", "build", "--mode", "{{environment.value}}"],
    },\n`
        break
      case 'webpack':
        commands += `    start: {
      cmd: "npx",
      args: ["webpack", "serve", "--mode", "{{environment.value}}"],
    },
    build: {
      cmd: "npx",
      args: ["webpack", "--mode", "{{environment.value}}"],
    },\n`
        break
      case 'nextjs':
        commands += `    start: {
      cmd: "npx",
      args: ["next", "dev"],
    },
    build: {
      cmd: "npx",
      args: ["next", "build"],
    },\n`
        break
      default:
        commands += `    start: {
      cmd: "npm",
      args: ["run", "dev"],
    },
    build: {
      cmd: "npm",
      args: ["run", "build"],
    },\n`
    }

    commands += '  },\n\n'
    return commands
  }

  /**
   * 生成选择器配置
   */
  private generateSelectorConfig(platformTypes: string | string[]): string {
    const platforms = Array.isArray(platformTypes) ? platformTypes : [platformTypes]

    let config = `  /**
   * 全局选择器配置 - 在选择环境之前先选择平台
   */
  globalSelector: {
    name: "platform",
    type: "selector",
    description: "选择目标平台",
    options: [\n`

    // 添加平台选项
    platforms.forEach((platform) => {
      let label = ''
      switch (platform) {
        case 'web':
          label = 'Web开发'
          break
        case 'android':
          label = '安卓开发'
          break
        case 'ios':
          label = 'iOS开发'
          break
        case 'miniapp':
          label = '小程序开发'
          break
        default:
          label = `${platform}开发`
      }

      config += `      { label: "${label}", value: "${platform}" },\n`
    })

    config += `    ],
  },\n\n`

    return config
  }

  /**
   * 生成环境配置
   */
  private generateEnvironments(
    environments: string[],
    projectType: string,
    useSelectors: boolean,
  ): string {
    let config = `  /**
   * 环境配置 - 定义可用的环境及其命令
   */
  environments: [\n`

    // 添加环境
    environments.forEach((env) => {
      let description = ''
      switch (env) {
        case 'development':
          description = '开发环境'
          break
        case 'test':
          description = '测试环境'
          break
        case 'hotfix':
          description = '热修复环境'
          break
        case 'production':
          description = '生产环境'
          break
        default:
          description = `${env}环境`
      }

      config += `    {
      name: "${env}",
      value: "${env}",
      description: "${description}",\n`

      // 如果是 Next.js 的生产环境，添加特殊命令
      if (projectType === 'nextjs' && env === 'production') {
        config += `      commands: {
        start: {
          cmd: "npx",
          args: ["next", "start"],
        },
      },\n`
      }

      // 如果使用选择器，添加局部选择器
      if (useSelectors && env === 'development') {
        config += `      /**
       * 局部选择器 - 在选择环境后再选择构建类型
       */
      localSelector: {
        name: "buildType",
        type: "selector",
        description: "选择构建类型",
        options: [
          { label: "Debug构建", value: "debug" },
          { label: "Release构建", value: "release" },
        ],
      },\n`
      }

      config += '    },\n'
    })

    config += '  ],\n'
    return config
  }
}

/**
 * 执行初始化命令
 */
export async function executeInitCommand(options: InitOptions = {}): Promise<void> {
  const initCommand = new InitCommand(options)
  await initCommand.execute()
}
