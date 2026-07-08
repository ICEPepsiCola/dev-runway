/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { HookExecutor } from '@/lib/hook-executor'
import { CommandExecutor } from '@/lib/command-executor'
import type { Hook, Environment, Config } from '@/config'

vi.mock('@/lib/command-executor')

describe('HookExecutor', () => {
  let hookExecutor: HookExecutor
  let mockCommandExecutor: any

  const mockEnvironment: Environment = {
    name: 'test',
    value: 'test',
    description: '测试环境',
  }

  const mockContext = { environment: mockEnvironment, selectors: {} }
  const mockConfig: Config = { environments: [mockEnvironment] }

  beforeEach(() => {
    vi.clearAllMocks()
    mockCommandExecutor = { execute: vi.fn().mockResolvedValue(0) }
    vi.mocked(CommandExecutor).mockImplementation(() => mockCommandExecutor)
    hookExecutor = new HookExecutor({ verbose: true })
  })

  test('executes command hook with template replacement', async () => {
    const hook: Hook = {
      name: 'test-command',
      description: '测试命令',
      type: 'command',
      cmd: 'echo',
      args: ['hello', '{{environment.name}}'],
    }

    await hookExecutor.executeHook(hook, mockContext, mockConfig)

    expect(mockCommandExecutor.execute).toHaveBeenCalledWith(
      'echo',
      ['hello', 'test'],
      expect.objectContaining({ description: '测试命令' }),
    )
  })

  test('executes function hook', async () => {
    const mockFn = vi.fn().mockResolvedValue(undefined)
    const hook: Hook = { name: 'fn', type: 'function', fn: mockFn }

    await hookExecutor.executeHook(hook, mockContext, mockConfig)
    expect(mockFn).toHaveBeenCalledWith(mockEnvironment, mockConfig)
  })

  test('rejects command hook without cmd', async () => {
    await expect(
      hookExecutor.executeHook({ type: 'command' }, mockContext, mockConfig),
    ).rejects.toThrow('Hook 执行失败')
  })

  test('rejects unsupported hook type', async () => {
    await expect(
      hookExecutor.executeHook({ type: 'unsupported' } as any, mockContext, mockConfig),
    ).rejects.toThrow('Hook 执行失败')
  })

  test('executes multiple hooks in sequence', async () => {
    const hooks: Hook[] = [
      { type: 'command', cmd: 'echo', args: ['hook1'] },
      { type: 'command', cmd: 'echo', args: ['hook2'] },
    ]

    await hookExecutor.executeHooks(hooks, mockContext, mockConfig, 'pre')
    expect(mockCommandExecutor.execute).toHaveBeenCalledTimes(2)
  })

  test('replaces selector variables in hook args', async () => {
    const context = {
      environment: mockEnvironment,
      selectors: { platform: 'web' },
    }

    await hookExecutor.executeHook(
      { type: 'command', cmd: 'echo', args: ['{{selectors.platform}}'] },
      context,
      mockConfig,
    )

    expect(mockCommandExecutor.execute).toHaveBeenCalledWith(
      'echo',
      ['web'],
      expect.any(Object),
    )
  })
})
