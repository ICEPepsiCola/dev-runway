/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, expect, vi, beforeEach } from 'vitest'
import inquirer from 'inquirer'
import { SelectorExecutor } from '@/lib/selector-executor'
import type { GlobalSelector } from '@/config'

// Mock inquirer
vi.mock('inquirer', () => ({ default: { prompt: vi.fn() } }))

describe('SelectorExecutor', () => {
  let selectorExecutor: SelectorExecutor
  let mockPrompt: any

  beforeEach(() => {
    vi.clearAllMocks()
    selectorExecutor = new SelectorExecutor()
    mockPrompt = vi.mocked(inquirer.prompt)
  })

  describe('executeSelector', () => {
    test('should execute selector successfully', async () => {
      // 准备测试数据
      const mockSelector: GlobalSelector = {
        name: 'platform',
        type: 'selector',
        description: '选择目标平台',
        options: [
          { label: '安卓开发', value: 'android' },
          { label: 'iOS开发', value: 'ios' },
        ],
      }

      // 模拟用户选择
      mockPrompt.mockResolvedValue({ selectedOption: 'android' })

      // 执行测试
      const result = await selectorExecutor.executeSelector(mockSelector)

      // 验证结果
      expect(mockPrompt).toHaveBeenCalledWith([{
        type: 'list',
        name: 'selectedOption',
        message: '选择目标平台',
        choices: [
          { name: '安卓开发', value: 'android' },
          { name: 'iOS开发', value: 'ios' },
        ],
      }])
      expect(result).toBe('android')
    })

    test('should throw error for invalid selected option', async () => {
      // 准备测试数据
      const mockSelector: GlobalSelector = {
        name: 'platform',
        type: 'selector',
        description: '选择目标平台',
        options: [
          { label: '安卓开发', value: 'android' },
          { label: 'iOS开发', value: 'ios' },
        ],
      }

      // 模拟用户选择一个不存在的选项
      mockPrompt.mockResolvedValue({ selectedOption: 'windows' })

      // 执行测试并验证异常
      await expect(selectorExecutor.executeSelector(mockSelector)).rejects.toThrow('未找到选中的选项')
    })

    test('should throw error for empty options', async () => {
      // 准备测试数据
      const mockSelector: GlobalSelector = {
        name: 'platform',
        type: 'selector',
        description: '选择目标平台',
        options: [],
      }

      // 执行测试并验证异常
      await expect(selectorExecutor.executeSelector(mockSelector)).rejects.toThrow('Selector 必须指定 options 属性')
    })
  })
})
