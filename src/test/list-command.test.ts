import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest'
import { ListCommand } from '@/lib/list-command'
import type { Config } from '@/config'

// 模拟 console.log
const originalConsoleLog = console.log
const mockConsoleLog = vi.fn()

describe('ListCommand', () => {
  beforeEach(() => {
    // 重置所有模拟
    vi.resetAllMocks()
    console.log = mockConsoleLog
  })

  afterEach(() => {
    // 恢复原始 console.log
    console.log = originalConsoleLog
  })

  describe('execute', () => {
    it('should display warning when no environments are found', () => {
      // 创建一个没有环境的配置
      const config: Config = { environments: [] }

      const listCommand = new ListCommand(config)
      listCommand.execute()

      // 验证是否显示了警告
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('没有找到任何环境配置'),
      )
    })

    it('should output environments in standard format', () => {
      // 创建一个有环境的配置
      const config: Config = {
        environments: [
          {
            name: 'development',
            value: 'dev',
            description: '开发环境',
          },
          {
            name: 'production',
            value: 'prod',
            description: '生产环境',
          },
        ],
      }

      const listCommand = new ListCommand(config)
      listCommand.execute()

      // 验证是否正确输出了环境
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('可用环境'),
      )
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('development'),
      )
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('production'),
      )
    })

    it('should output environments in JSON format', () => {
      // 创建一个有环境的配置
      const config: Config = {
        environments: [
          {
            name: 'development',
            value: 'dev',
            description: '开发环境',
          },
        ],
      }

      const listCommand = new ListCommand(config, { json: true })
      listCommand.execute()

      // 验证是否以 JSON 格式输出
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.any(String),
      )

      // 获取调用参数
      const jsonOutput = mockConsoleLog.mock.calls[0][0]
      const parsed = JSON.parse(jsonOutput)

      // 验证 JSON 格式是否正确
      expect(parsed).toEqual([
        {
          name: 'development',
          value: 'dev',
          description: '开发环境',
          hasCommands: false,
          hasLocalSelector: false,
        },
      ])
    })

    it('should output detailed information in verbose mode', () => {
      // 创建一个有详细信息的配置
      const config: Config = {
        globalSelector: {
          name: 'platform',
          type: 'selector',
          description: '选择目标平台',
          options: [
            { label: 'Web开发', value: 'web' },
            { label: '安卓开发', value: 'android' },
          ],
        },
        environments: [
          {
            name: 'development',
            value: 'dev',
            description: '开发环境',
            commands: {
              start: {
                cmd: 'npx',
                args: ['vite'],
              },
            },
            localSelector: {
              name: 'buildType',
              type: 'selector',
              description: '选择构建类型',
              options: [
                { label: 'Debug构建', value: 'debug' },
                { label: 'Release构建', value: 'release' },
              ],
            },
          },
        ],
      }

      const listCommand = new ListCommand(config, { verbose: true })
      listCommand.execute()

      // 验证是否显示了详细信息
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('值:'),
      )
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('命令:'),
      )
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('局部选择器:'),
      )
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('全局选择器:'),
      )
    })
  })
})
