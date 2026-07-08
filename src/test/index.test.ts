/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, expect, beforeEach, vi } from 'vitest'
import { spawn } from 'child_process'
import { ConfigManager, executeCommand } from '@/lib'

// Mock child_process
vi.mock('child_process', () => ({ spawn: vi.fn() }))

// Mock chalk
vi.mock('chalk', () => ({
  default: {
    red: vi.fn((text) => text),
    yellow: vi.fn((text) => text),
    blue: vi.fn((text) => text),
    green: vi.fn((text) => text),
    gray: vi.fn((text) => text),
    cyan: vi.fn((text) => text),
    magenta: vi.fn((text) => text),
    bold: vi.fn((text) => text),
  },
}))

// Mock inquirer
vi.mock('inquirer', () => ({ default: { prompt: vi.fn() } }))

const mockSpawn = vi.mocked(spawn)

describe('CLI Integration Tests', () => {
  let mockChildProcess: any

  beforeEach(() => {
    // Mock spawn
    mockChildProcess = {
      on: vi.fn((event: string, callback: (code: number) => void) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10)
        }
        return mockChildProcess
      }),
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
    }
    mockSpawn.mockReturnValue(mockChildProcess as any)

    vi.clearAllMocks()
  })

  // ArgsParser 功能已被 SubcommandManager 替代，相关测试移至 subcommands.test.ts

  test('should load and validate configuration', async () => {
    const config = await ConfigManager.load()

    expect(config).toBeDefined()
    expect(config.environments).toBeDefined()
    expect(config.environments.length).toBeGreaterThan(0)

    // Validate configuration
    expect(() => ConfigManager.validate(config)).not.toThrow()
  })

  test('should execute vite command with environment', async () => {
    const environment = {
      name: 'development',
      value: 'development',
      description: '开发环境',
      commands: {
        start: {
          cmd: 'npx',
          args: ['vite', '--mode', 'development', '--host'],
        },
      },
    }

    const config = {
      environments: [environment],
      defaultCommands: {
        start: {
          cmd: 'npx',
          args: ['vite', '--mode', '{{environment.value}}', '--host'],
        },
      },
    }

    await executeCommand('start', environment, config, { verbose: true })

    expect(mockSpawn).toHaveBeenCalledWith(
      'npx',
      ['vite', '--mode', 'development', '--host'],
      expect.any(Object),
    )
  })
})
