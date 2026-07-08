/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll,
} from 'vitest'
import { join } from 'path'
import fs from 'fs'
import { SubcommandManager } from '../lib/subcommands'
import { ConfigManager } from '../lib/config'

// 模拟 CommandExecutor
vi.mock('../lib/command-executor', () => {
  const CommandExecutor = vi.fn().mockImplementation(() => ({ execute: vi.fn().mockResolvedValue(0) }))
  return {
    CommandExecutor,
    executeCommand: vi.fn().mockResolvedValue(0),
  }
})

// 创建临时配置文件的路径
const tempConfigPath = join(process.cwd(), 'temp-test-config.js')

// 模拟配置文件内容
const mockConfigContent = `
module.exports = {
  environments: [
    {
      name: 'development',
      value: 'development',
      description: '开发环境',
    }
  ],
  customCommands: {
    lint: {
      cmd: 'npm',
      args: ['run', 'lint'],
      env: { NODE_ENV: 'development' },
    },
    test: {
      cmd: 'npm',
      args: ['run', 'test'],
      env: { NODE_ENV: 'test' },
    },
    start: {
      cmd: 'echo',
      args: ['这个命令会被忽略，因为与内置命令冲突'],
    },
  }
}
`

// 全局模拟 process.exit
const originalProcessExit = process.exit
beforeAll(() => {
  process.exit = vi.fn() as any
})
afterAll(() => {
  process.exit = originalProcessExit
})

describe('自定义命令集成测试', () => {
  let subcommandManager: SubcommandManager
  let originalArgv: string[]

  beforeEach(() => {
    // 保存原始的 process.argv
    originalArgv = process.argv

    // 创建临时配置文件
    fs.writeFileSync(tempConfigPath, mockConfigContent)

    // 创建 SubcommandManager 实例
    subcommandManager = new SubcommandManager()

    // 注意：我们不再在这里模拟 parse 方法，以避免干扰其他测试
  })

  afterEach(() => {
    // 恢复原始的 process.argv
    process.argv = originalArgv

    // 删除临时配置文件
    if (fs.existsSync(tempConfigPath)) {
      fs.unlinkSync(tempConfigPath)
    }

    // 清除所有模拟的调用记录
    vi.clearAllMocks()
  })

  it('应该能够通过命令行参数执行自定义命令', async () => {
    // 模拟 process.argv
    process.argv = ['node', 'index.js', 'lint', '--verbose', '--config', tempConfigPath]

    // 模拟 executeCustomCommand 方法
    const executeCustomCommandSpy = vi.spyOn(subcommandManager, 'executeCustomCommand')
      .mockResolvedValue()

    // 加载配置
    const config = await ConfigManager.load(process.cwd(), tempConfigPath)

    // 注册自定义命令
    subcommandManager.registerCustomCommands(config)

    // 执行自定义命令
    await subcommandManager.executeCustomCommand('lint', { verbose: true, config: tempConfigPath })

    // 验证 executeCustomCommand 方法被调用
    expect(executeCustomCommandSpy).toHaveBeenCalledWith('lint', expect.objectContaining({
      verbose: true,
      config: tempConfigPath,
    }))
  })

  it('应该能够处理配置文件中的环境变量', async () => {
    // 模拟 executeCustomCommand 方法
    const executeCustomCommandSpy = vi.spyOn(subcommandManager, 'executeCustomCommand')
      .mockImplementation(async () => { })

    // 加载配置
    const config = await ConfigManager.load(process.cwd(), tempConfigPath)

    // 注册自定义命令
    subcommandManager.registerCustomCommands(config)

    // 执行自定义命令
    await subcommandManager.executeCustomCommand('lint', { verbose: true, config: tempConfigPath })

    // 验证 executeCustomCommand 方法被调用
    expect(executeCustomCommandSpy).toHaveBeenCalledWith(
      'lint',
      expect.objectContaining({ verbose: true, config: tempConfigPath }),
    )
  })

  it('应该正确处理与内置命令冲突的自定义命令', async () => {
    // 模拟 console.warn
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { })

    // 加载配置
    const config = await ConfigManager.load(process.cwd(), tempConfigPath)

    // 注册自定义命令
    subcommandManager.registerCustomCommands(config)

    // 验证警告信息已输出
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('警告: 自定义命令 "start" 与内置命令冲突'),
    )

    // 恢复 console.warn
    consoleWarnSpy.mockRestore()
  })
})
