import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest'
import fs from 'fs'
import { InitCommand } from '@/lib/init-command'
import inquirer from 'inquirer'

// 模拟 fs 和 inquirer
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    writeFileSync: vi.fn(),
  },
}))

vi.mock('inquirer', () => ({ default: { prompt: vi.fn() } }))

// 模拟 console.log
const originalConsoleLog = console.log
const mockConsoleLog = vi.fn()

describe('InitCommand', () => {
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
    it('should create config file when it does not exist', async () => {
      // 模拟文件不存在
      vi.mocked(fs.existsSync).mockReturnValue(false)

      // 模拟用户回答
      vi.mocked(inquirer.prompt).mockResolvedValue({
        projectType: 'vite',
        useSelectors: false,
        environments: ['development', 'production'],
      })

      const initCommand = new InitCommand()
      await initCommand.execute()

      // 验证是否调用了 writeFileSync
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1)
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('runway.config.ts'),
        expect.stringContaining('export default {'),
      )

      // 验证是否显示了成功消息
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('✅ 配置文件已创建'),
      )
    })

    it('should prompt for overwrite when config file exists', async () => {
      // 模拟文件存在
      vi.mocked(fs.existsSync).mockReturnValue(true)

      // 模拟用户选择不覆盖
      vi.mocked(inquirer.prompt).mockResolvedValueOnce({ overwrite: false })

      const initCommand = new InitCommand()
      await initCommand.execute()

      // 验证是否没有调用 writeFileSync
      expect(fs.writeFileSync).not.toHaveBeenCalled()

      // 验证是否显示了取消消息
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('⚠️ 操作已取消'),
      )
    })

    it('should overwrite config file when force option is true', async () => {
      // 模拟文件存在
      vi.mocked(fs.existsSync).mockReturnValue(true)

      // 模拟用户回答
      vi.mocked(inquirer.prompt).mockResolvedValue({
        projectType: 'webpack',
        useSelectors: true,
        platformType: ['web', 'android'],
        environments: ['development', 'production'],
      })

      const initCommand = new InitCommand({ force: true })
      await initCommand.execute()

      // 验证是否调用了 writeFileSync
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1)

      // 验证是否没有提示覆盖
      expect(inquirer.prompt).not.toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'overwrite' }),
        ]),
      )
    })

    it('should use template preset when template option is provided', async () => {
      // 模拟文件不存在
      vi.mocked(fs.existsSync).mockReturnValue(false)

      const initCommand = new InitCommand({ template: 'vite' })
      await initCommand.execute()

      // 验证是否调用了 writeFileSync
      expect(fs.writeFileSync).toHaveBeenCalledTimes(1)

      // 验证是否没有提示问题
      expect(inquirer.prompt).not.toHaveBeenCalled()
    })

    it('should throw error for unsupported template', async () => {
      // 模拟文件不存在
      vi.mocked(fs.existsSync).mockReturnValue(false)

      const initCommand = new InitCommand({ template: 'unsupported' as unknown as 'vite' | 'webpack' | 'nextjs' })

      await expect(initCommand.execute()).rejects.toThrow('不支持的模板类型')
    })
  })

  describe('generateConfigContent', () => {
    it('should generate Vite config correctly', async () => {
      // 模拟文件不存在
      vi.mocked(fs.existsSync).mockReturnValue(false)

      // 模拟用户回答
      vi.mocked(inquirer.prompt).mockResolvedValue({
        projectType: 'vite',
        useSelectors: false,
        environments: ['development', 'production'],
      })

      const initCommand = new InitCommand()
      await initCommand.execute()

      // 验证生成的配置内容
      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0]
      const configContent = writeCall[1] as string

      expect(configContent).toContain('import type { Config } from "dev-runway"')
      expect(configContent).toContain('defaultCommands:')
      expect(configContent).toContain('vite')
      expect(configContent).toContain('environments:')
      expect(configContent).toContain('development')
      expect(configContent).toContain('production')
    })

    it('should generate config with selectors correctly', async () => {
      // 模拟文件不存在
      vi.mocked(fs.existsSync).mockReturnValue(false)

      // 模拟用户回答
      vi.mocked(inquirer.prompt).mockResolvedValue({
        projectType: 'vite',
        useSelectors: true,
        platformType: ['web', 'android'],
        environments: ['development', 'production'],
      })

      const initCommand = new InitCommand()
      await initCommand.execute()

      // 验证生成的配置内容
      const writeCall = vi.mocked(fs.writeFileSync).mock.calls[0]
      const configContent = writeCall[1] as string

      expect(configContent).toContain('globalSelector:')
      expect(configContent).toContain('name: "platform"')
      expect(configContent).toContain('Web开发')
      expect(configContent).toContain('安卓开发')
    })
  })
})
