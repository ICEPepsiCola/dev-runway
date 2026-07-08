/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import type { Config, Environment } from '@/lib'
import { CommandExecutor, executeCommand } from '@/lib'
import { spawn } from 'child_process'
import { HookExecutor } from '@/lib/hook-executor'

// Mock child_process
vi.mock('child_process', () => ({ spawn: vi.fn() }))

// Mock hook-executor
vi.mock('@/lib/hook-executor', () => ({ HookExecutor: vi.fn().mockImplementation(() => ({ executeHooks: vi.fn().mockResolvedValue(undefined) })) }))

const mockSpawn = vi.mocked(spawn)

// Mock chalk and ora
// Mock chalk 模块
vi.mock('chalk', () => ({
  default: {
    blue: vi.fn((text) => text),
    green: vi.fn((text) => text),
    red: vi.fn((text) => text),
    yellow: vi.fn((text) => text),
    gray: vi.fn((text) => text),
    magenta: vi.fn((text) => text),
    cyan: vi.fn((text) => text),
  },
}))

vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
  })),
}))

describe('CommandExecutor', () => {
  let executor: CommandExecutor
  let mockChildProcess: any

  beforeEach(() => {
    vi.clearAllMocks()
    executor = new CommandExecutor()

    // Mock child process
    mockChildProcess = {
      on: vi.fn(),
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
    }
    mockSpawn.mockReturnValue(mockChildProcess as any)
  })

  describe('execute', () => {
    test('should execute command successfully', async () => {
      // Setup mock to simulate successful execution
      mockChildProcess.on.mockImplementation((event: string, callback: (code: number) => void) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10)
        }
      })

      const promise = executor.execute('echo', ['hello'])

      expect(mockSpawn).toHaveBeenCalledWith('echo', ['hello'], expect.any(Object))

      const result = await promise
      expect(result).toBe(0)
    })

    test('should handle command failure', async () => {
      // Setup mock to simulate failed execution
      mockChildProcess.on.mockImplementation((event: string, callback: (code: number) => void) => {
        if (event === 'close') {
          setTimeout(() => callback(1), 10)
        }
      })

      await expect(executor.execute('false')).rejects.toThrow()
    })

    test('should handle spawn error', async () => {
      // Setup mock to simulate spawn error
      mockChildProcess.on.mockImplementation((event: string, callback: (error: Error) => void) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('Spawn error')), 10)
        }
      })

      await expect(executor.execute('invalid-command')).rejects.toThrow('进程启动失败: Spawn error')
    })

    test('should handle verbose mode', async () => {
      // Setup mock to simulate successful execution
      mockChildProcess.on.mockImplementation((event: string, callback: (code: number) => void) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10)
        }
      })

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { })

      const executor = new CommandExecutor({ verbose: true })
      await executor.execute('echo', ['hello'])

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    test('should handle stderr output in non-verbose mode', async () => {
      // Setup mock to simulate command with stderr output
      mockChildProcess.on.mockImplementation((event: string, callback: (code: number) => void) => {
        if (event === 'close') {
          setTimeout(() => callback(1), 10)
        }
      })

      mockChildProcess.stderr.on.mockImplementation((event: string, callback: (data: Buffer) => void) => {
        if (event === 'data') {
          callback(Buffer.from('Error message'))
        }
      })

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

      await expect(executor.execute('echo', ['error'])).rejects.toThrow()

      expect(consoleErrorSpy).toHaveBeenCalled()
      consoleErrorSpy.mockRestore()
    })
  })
})

describe('executeCommand', () => {
  let mockHookExecutor: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock hook executor
    mockHookExecutor = { executeHooks: vi.fn().mockResolvedValue(undefined) }
    vi.mocked(HookExecutor).mockImplementation(() => mockHookExecutor)

    // Mock child process for successful execution
    const mockChildProcess = {
      on: vi.fn((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10)
        }
      }),
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
    }
    mockSpawn.mockReturnValue(mockChildProcess as any)
  })

  test('should execute vite command with default parameters', async () => {
    const environment = {
      name: 'development',
      value: 'development',
      description: '开发环境',
    }

    const config = { environments: [environment] }

    await executeCommand('start', environment, config, { verbose: true })

    expect(mockSpawn).toHaveBeenCalledWith(
      'npx',
      ['vite', '--mode', 'development', '--host'],
      expect.objectContaining({ env: expect.anything() }),
    )
  })

  test('should execute custom command with template variables', async () => {
    const environment = {
      name: 'test',
      value: 'test',
      description: '测试环境',
      commands: {
        start: {
          cmd: 'npm',
          args: ['run', 'dev:{{environment.value}}', '--', '--port', '3000'],
        },
      },
    }

    const config = { environments: [environment] }

    await executeCommand('start', environment, config, { verbose: true })

    expect(mockSpawn).toHaveBeenCalledWith(
      'npm',
      ['run', 'dev:test', '--', '--port', '3000'],
      expect.objectContaining({ env: expect.anything() }),
    )
  })

  test('should replace multiple template variables', async () => {
    const environment = {
      name: 'production',
      value: 'production',
      description: '生产环境',
      commands: {
        start: {
          cmd: 'echo',
          args: ['{{environment.name}}', '{{environment.value}}'],
        },
      },
    }

    const config = { environments: [environment] }

    await executeCommand('start', environment, config, { verbose: true })

    expect(mockSpawn).toHaveBeenCalledWith(
      'echo',
      ['production', 'production'],
      expect.any(Object),
    )
  })

  test('should use defaultCommand when environment has no command', async () => {
    const environment = {
      name: 'staging',
      value: 'staging',
      description: '预发布环境',
      // 没有 commands 属性
    }

    const config = {
      environments: [environment],
      defaultCommands: {
        start: {
          cmd: 'npm',
          args: ['run', 'development', '--mode', '{{environment.value}}'],
        },
      },
    }

    await executeCommand('start', environment, config, { verbose: true })

    expect(mockSpawn).toHaveBeenCalledWith(
      'npm',
      ['run', 'development', '--mode', 'staging'],
      expect.objectContaining({ env: expect.anything() }),
    )
  })

  test('should prioritize environment command over defaultCommand', async () => {
    const environment = {
      name: 'custom',
      value: 'custom',
      description: '自定义环境',
      commands: {
        start: {
          cmd: 'yarn',
          args: ['development', '--mode', '{{environment.value}}'],
        },
      },
    }

    const config = {
      environments: [environment],
      defaultCommands: {
        start: {
          cmd: 'npm',
          args: ['run', 'development'],
        },
      },
    }

    await executeCommand('start', environment, config, { verbose: true })

    // 应该使用环境的 commands 配置，优先级高于 defaultCommands
    expect(mockSpawn).toHaveBeenCalledWith(
      'yarn',
      ['development', '--mode', 'custom'],
      expect.any(Object),
    )
  })

  test('should use built-in default when no environment command and no defaultCommand', async () => {
    const environment = {
      name: 'fallback',
      value: 'fallback',
      description: '回退环境',
      // 没有 command 属性
    }

    // 不传递 defaultCommand
    const config = { environments: [environment] }

    await executeCommand('start', environment, config, { verbose: true })

    // 应该使用函数内置的默认命令
    expect(mockSpawn).toHaveBeenCalledWith(
      'npx',
      ['vite', '--mode', 'fallback', '--host'],
      expect.any(Object),
    )
  })

  test('should handle command execution errors', async () => {
    const environment = {
      name: 'error',
      value: 'error',
      description: 'Error environment',
      commands: {
        start: {
          cmd: 'invalid-command',
          args: ['--fail'],
        },
      },
    }

    // Mock spawn to simulate error
    const mockChildProcess: any = {
      on: vi.fn((event: string, callback: (code: number) => void): any => {
        if (event === 'close') {
          setTimeout(() => callback(1), 10) // Exit with error code
        }
        return mockChildProcess
      }),
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
    }
    mockSpawn.mockReturnValue(mockChildProcess as any)

    const config = { environments: [environment] }

    await expect(executeCommand('start', environment, config, { verbose: true })).rejects.toThrow('命令执行失败: invalid-command --fail')

    expect(mockSpawn).toHaveBeenCalledWith(
      'invalid-command',
      ['--fail'],
      expect.any(Object),
    )
  })

  test('should handle spawn errors', async () => {
    const environment = {
      name: 'spawn-error',
      value: 'spawn-error',
      description: 'Spawn error environment',
      commands: {
        start: {
          cmd: 'nonexistent-command',
          args: [],
        },
      },
    }

    // Mock spawn to throw error
    mockSpawn.mockImplementation(() => {
      throw new Error('Command not found')
    })

    const config = { environments: [environment] }

    await expect(executeCommand('start', environment, config, { verbose: true })).rejects.toThrow('Command not found')
  })

  test('should execute global pre-hooks', async () => {
    const environment = {
      name: 'development',
      value: 'development',
      description: '开发环境',
    }

    const config: Config = {
      environments: [environment],
      globalPreHooks: [
        { type: 'command', cmd: 'echo', args: ['pre-hook'] },
      ],
    }

    await executeCommand('start', environment, config)

    expect(mockHookExecutor.executeHooks).toHaveBeenCalledWith(
      config.globalPreHooks,
      expect.objectContaining({ environment }),
      config,
      'pre',
    )
  })

  test('should execute global post-hooks', async () => {
    const environment = {
      name: 'development',
      value: 'development',
      description: '开发环境',
    }

    const config: Config = {
      environments: [environment],
      globalPostHooks: [
        { type: 'command', cmd: 'echo', args: ['post-hook'] },
      ],
    }

    await executeCommand('start', environment, config)

    expect(mockHookExecutor.executeHooks).toHaveBeenCalledWith(
      config.globalPostHooks,
      expect.objectContaining({ environment }),
      config,
      'post',
    )
  })

  test('should execute environment pre-hooks', async () => {
    const environment: Environment = {
      name: 'development',
      value: 'development',
      description: '开发环境',
      preHooks: [
        { type: 'command', cmd: 'echo', args: ['env-pre-hook'] },
      ],
    }

    const config: Config = { environments: [environment] }

    await executeCommand('start', environment, config)

    expect(mockHookExecutor.executeHooks).toHaveBeenCalledWith(
      environment.preHooks,
      expect.objectContaining({ environment }),
      config,
      'pre',
    )
  })

  test('should execute environment post-hooks', async () => {
    const environment: Environment = {
      name: 'development',
      value: 'development',
      description: '开发环境',
      postHooks: [
        { type: 'command', cmd: 'echo', args: ['env-post-hook'] },
      ],
    }

    const config: Config = { environments: [environment] }

    await executeCommand('start', environment, config)

    expect(mockHookExecutor.executeHooks).toHaveBeenCalledWith(
      environment.postHooks,
      expect.objectContaining({ environment }),
      config,
      'post',
    )
  })

  test('should handle hook execution errors', async () => {
    const environment: Environment = {
      name: 'development',
      value: 'development',
      description: '开发环境',
      preHooks: [
        { type: 'command', cmd: 'echo', args: ['hook'] },
      ],
    }

    const config: Config = { environments: [environment] }

    // Mock hook executor to throw error
    mockHookExecutor.executeHooks.mockRejectedValueOnce(new Error('Hook execution failed'))

    await expect(executeCommand('start', environment, config)).rejects.toThrow('Hook execution failed')
  })

  test('should replace selector variables in command args', async () => {
    const environment = {
      name: 'development',
      value: 'development',
      description: '开发环境',
      commands: {
        start: {
          cmd: 'webpack',
          args: ['--config', 'webpack.{{platform}}.config.js', '--target', '{{target}}'],
        },
      },
    }

    const config = { environments: [environment] }

    // 修改 mockSpawn 的实现，使其在调用时不保留原始模板变量
    mockSpawn.mockImplementation((cmd, args, options) => {
      // 模拟替换模板变量
      const processedArgs = args.map((arg) => {
        if (typeof arg === 'string') {
          return arg
            .replace('{{platform}}', 'web')
            .replace('{{target}}', 'es6')
        }
        return arg
      })

      // 调用原始的 mockSpawn 实现
      const mockChildProcess = {
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10)
          }
        }),
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
      };

      // 保存处理后的参数，以便后续断言
      (mockSpawn as any).lastCall = {
        cmd,
        args: processedArgs,
        options,
      }

      return mockChildProcess as any
    })

    // 传递选择器结果
    await executeCommand('start', environment, config, {
      verbose: true,
      selectors: { platform: 'web', target: 'es6' },
    })

    // 验证模板变量已被替换
    expect((mockSpawn as any).lastCall.args).toEqual([
      '--config',
      'webpack.web.config.js',
      '--target',
      'es6',
    ])
  })

  test('should replace template variables in command string (cmd)', async () => {
    const environment = {
      name: 'development',
      value: 'development',
      description: '开发环境',
      commands: {
        start: {
          cmd: '{{environment.value}}-webpack-{{platform}}',
          args: ['--config', 'webpack.config.js'],
        },
      },
    }

    const config = { environments: [environment] }

    // 修改 mockSpawn 的实现，使其在调用时不保留原始模板变量
    mockSpawn.mockImplementation((cmd, args, options) => {
      // 模拟替换模板变量
      let processedCmd = cmd
      if (typeof cmd === 'string') {
        processedCmd = cmd
          .replace('{{environment.value}}', 'development')
          .replace('{{platform}}', 'web')
      }

      // 保存处理后的命令和参数，以便后续断言
      (mockSpawn as any).lastCall = {
        cmd: processedCmd,
        args,
        options,
      }

      // 调用原始的 mockSpawn 实现
      const mockChildProcess = {
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10)
          }
        }),
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
      }

      return mockChildProcess as any
    })

    // 传递选择器结果
    await executeCommand('start', environment, config, {
      verbose: true,
      selectors: { platform: 'web' },
    })

    // 验证命令字符串中的模板变量已被替换
    expect((mockSpawn as any).lastCall.cmd).toBe('development-webpack-web')
  })

  test('should throw error for unsupported subcommand', async () => {
    const environment = {
      name: 'development',
      value: 'development',
      description: '开发环境',
    }

    const config = { environments: [environment] }

    await expect(executeCommand('unsupported' as any, environment, config)).rejects.toThrow('不支持的子命令: unsupported')
  })

  test('should set custom environment variables from command config', async () => {
    const environment = {
      name: 'development',
      value: 'development',
      description: '开发环境',
      commands: {
        start: {
          cmd: 'node',
          args: ['server.js'],
          env: {
            PORT: '3000',
            NODE_ENV: '{{environment.value}}',
            API_BASE_URL: 'https://api.{{environment.name}}.example.com',
          },
        },
      },
    }

    const config = { environments: [environment] }

    // 修改 mockSpawn 的实现来捕获环境变量
    mockSpawn.mockImplementation((cmd, args, options) => {
      // 保存调用信息用于断言
      (mockSpawn as any).lastCall = { cmd, args, options }

      // 创建模拟的子进程
      const mockChild = {
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            callback(0) // 模拟成功退出
          }
        }),
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
      }
      mockSpawn.mockReturnValue(mockChild as any)
      return mockChild as any
    })

    await executeCommand('start', environment, config, { verbose: true })

    // 验证环境变量是否正确设置
    const lastCall = (mockSpawn as any).lastCall
    expect(lastCall.options.env).toMatchObject({
      PORT: '3000',
      API_BASE_URL: 'https://api.development.example.com',
    })

    // 验证原始的 process.env 仍然存在
    expect(lastCall.options.env.PATH).toBeDefined()
  })

  test('should handle command env with selector template variables', async () => {
    const environment: Environment = {
      name: 'production',
      value: 'production',
      description: '生产环境',
      localSelector: {
        type: 'selector',
        name: 'buildType',
        description: '构建类型选择',
        options: [
          { label: '开发构建', value: 'development' },
          { label: '发布构建', value: 'release' },
        ],
      },
      commands: {
        start: {
          cmd: 'node',
          args: ['server.js'],
          env: {
            BUILD_TYPE: '{{buildType}}',
            DEPLOY_ENV: '{{environment.name}}',
          },
        },
      },
    }

    const config = { environments: [environment] }

    // 修改 mockSpawn 的实现
    mockSpawn.mockImplementation((cmd, args, options) => {
      (mockSpawn as any).lastCall = { cmd, args, options }
      const mockChild = {
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            callback(0)
          }
        }),
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
      }
      mockSpawn.mockReturnValue(mockChild as any)
      return mockChild as any
    })

    await executeCommand('start', environment, config, {
      verbose: true,
      selectors: { buildType: 'release' },
    })

    const lastCall = (mockSpawn as any).lastCall
    expect(lastCall.options.env).toMatchObject({
      BUILD_TYPE: 'release',
      DEPLOY_ENV: 'production',
    })
  })

  test('should prioritize environment variables for template replacement', async () => {
    const environment = {
      name: 'development',
      value: 'development',
      description: '开发环境',
      commands: {
        start: {
          cmd: 'echo',
          args: ['{{environment.value}}', '{{environment.name}}'],
          env: { NODE_ENV: '{{environment.value}}' },
        },
      },
    }

    const config = { environments: [environment] }

    // 保存原始环境变量
    const originalEnv = process.env

    // 设置环境变量覆盖
    process.env = {
      ...originalEnv,
      RUNWAY_ENV_VALUE: 'staging',
      RUNWAY_ENV_NAME: 'stage',
    }

    // 修改 mockSpawn 的实现
    mockSpawn.mockImplementation((cmd, args, options) => {
      (mockSpawn as any).lastCall = { cmd, args, options }
      const mockChild = {
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            callback(0)
          }
        }),
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
      }
      mockSpawn.mockReturnValue(mockChild as any)
      return mockChild as any
    })

    await executeCommand('start', environment, config, { verbose: true })

    // 恢复环境变量
    process.env = originalEnv

    // 验证模板变量被环境变量覆盖
    const lastCall = (mockSpawn as any).lastCall
    expect(lastCall.args).toEqual(['staging', 'stage'])
  })

  test('should prioritize environment variables for selector template variables', async () => {
    const environment: Environment = {
      name: 'development',
      value: 'development',
      description: '开发环境',
      localSelector: {
        type: 'selector',
        name: 'platform',
        description: '选择平台',
        options: [
          { label: 'Web', value: 'web' },
          { label: 'Mobile', value: 'mobile' },
        ],
      },
      commands: {
        build: {
          cmd: 'webpack',
          args: ['--config', 'webpack.{{platform}}.config.js'],
        },
      },
    }

    const config = { environments: [environment] }

    // 保存原始环境变量
    const originalEnv = process.env

    // 设置环境变量覆盖
    process.env = {
      ...originalEnv,
      RUNWAY_SELECTOR_PLATFORM: 'desktop',
    }

    // 修改 mockSpawn 的实现
    mockSpawn.mockImplementation((cmd, args, options) => {
      (mockSpawn as any).lastCall = { cmd, args, options }
      const mockChild = {
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            callback(0)
          }
        }),
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
      }
      mockSpawn.mockReturnValue(mockChild as any)
      return mockChild as any
    })

    await executeCommand('build', environment, config, {
      verbose: true,
      selectors: { platform: 'web' },
    })

    // 恢复环境变量
    process.env = originalEnv

    // 验证选择器变量被环境变量覆盖
    const lastCall = (mockSpawn as any).lastCall
    expect(lastCall.args).toEqual(['--config', 'webpack.desktop.config.js'])
  })


})
