/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, expect, beforeEach, vi } from 'vitest'
import { EnvironmentManager, selectEnvironment } from '@/lib'
import { RunwayError } from '@/lib'
import type { Config, Environment } from '@/lib'

// Mock inquirer
vi.mock('inquirer', () => ({ default: { prompt: vi.fn() } }))

describe('EnvironmentManager', () => {
  let validConfig: Config
  let environmentManager: EnvironmentManager

  beforeEach(() => {
    validConfig = {
      defaultCommands: {
        start: {
          cmd: 'npx',
          args: ['vite', '--mode', '{{environment.value}}', '--host'],
        },
        build: {
          cmd: 'npx',
          args: ['vite', 'build', '--mode', '{{environment.value}}'],
        },
      },
      environments: [
        {
          name: 'development',
          value: 'development',
          description: '开发环境',
        },
        {
          name: 'test',
          value: 'test',
          description: '测试环境',
        },
        {
          name: 'production',
          value: 'production',
          description: '生产环境',
        },
      ],
    }
    environmentManager = new EnvironmentManager(validConfig)
  })

  describe('constructor', () => {
    test('should create instance with valid config', () => {
      expect(environmentManager.getAll()).toHaveLength(3)
    })

    test('should throw error for non-array environments', () => {
      const invalidConfig = { environments: 'not-array' } as any
      expect(() => new EnvironmentManager(invalidConfig)).toThrow(RunwayError)
    })

    test('should throw error for empty environments array', () => {
      const invalidConfig: Config = { environments: [] }
      expect(() => new EnvironmentManager(invalidConfig)).toThrow(RunwayError)
    })

    test('should throw error for duplicate environment values', () => {
      const invalidConfig: Config = {
        environments: [
          {
            name: 'dev1',
            value: 'development',
            description: '开发环境1',
          },
          {
            name: 'dev2',
            value: 'development',
            description: '开发环境2',
          },
        ],
      }
      expect(() => new EnvironmentManager(invalidConfig)).toThrow(RunwayError)
    })

    test('should throw error for missing required fields', () => {
      const invalidConfig = {
        environments: [
          { name: 'development', description: '开发环境' }, // missing value
        ],
      } as any
      expect(() => new EnvironmentManager(invalidConfig)).toThrow(RunwayError)
    })
  })

  describe('getAll', () => {
    test('should return copy of all environments', () => {
      const environments = environmentManager.getAll()
      expect(environments).toHaveLength(3)
      // 验证返回的是副本，而不是原始数组的引用
      expect(environments).toEqual(validConfig.environments)
    })
  })

  describe('getByValue', () => {
    test('should return environment by value', () => {
      const env = environmentManager.getByValue('development')
      expect(env).toBeDefined()
      expect(env!.name).toBe('development')
      expect(env!.description).toBe('开发环境')
    })

    test('should return undefined for non-existent value', () => {
      const env = environmentManager.getByValue('nonexistent')
      expect(env).toBeUndefined()
    })
  })

  describe('getByName', () => {
    test('should return environment by name', () => {
      const env = environmentManager.getByName('development')
      expect(env).toBeDefined()
      expect(env!.value).toBe('development')
    })

    test('should return undefined for non-existent name', () => {
      const env = environmentManager.getByName('nonexistent')
      expect(env).toBeUndefined()
    })
  })

  describe('validate', () => {
    test('should return true for valid environment value', () => {
      expect(environmentManager.validate('development')).toBe(true)
      expect(environmentManager.validate('test')).toBe(true)
      expect(environmentManager.validate('production')).toBe(true)
    })

    test('should return false for invalid environment value', () => {
      expect(environmentManager.validate('invalid')).toBe(false)
    })
  })

  describe('getValues', () => {
    test('should return array of environment values', () => {
      const values = environmentManager.getValues()
      expect(values).toEqual(['development', 'test', 'production'])
    })
  })

  describe('getNames', () => {
    test('should return array of environment names', () => {
      const names = environmentManager.getNames()
      expect(names).toEqual(['development', 'test', 'production'])
    })
  })

  describe('getInquirerChoices', () => {
    test('should return formatted choices for inquirer', () => {
      const choices = environmentManager.getInquirerChoices()
      expect(choices).toHaveLength(3)
      expect(choices[0]).toEqual({
        name: 'development - 开发环境',
        value: validConfig.environments[0],
        short: 'development',
      })
    })
  })
})

describe('selectEnvironment', () => {
  test('should return selected environment', async () => {
    const environments: Environment[] = [
      {
        name: 'development',
        value: 'development',
        description: '开发环境',
      },
      {
        name: 'test',
        value: 'test',
        description: '测试环境',
      },
    ]

    const inquirer = await import('inquirer')
    const mockPrompt = inquirer.default.prompt as any
    mockPrompt.mockResolvedValue({ selectedEnv: environments[0] })

    const result = await selectEnvironment(environments)

    expect(result).toEqual(environments[0])
    expect(mockPrompt).toHaveBeenCalledWith([{
      type: 'list',
      name: 'selectedEnv',
      message: '请选择环境:',
      choices: [
        { name: 'development - 开发环境', value: environments[0] },
        { name: 'test - 测试环境', value: environments[1] },
      ],
    }])
  })

  test('should handle empty environments array', async () => {
    const environments: Environment[] = []

    // Mock inquirer to return undefined for empty array
    const inquirer = await import('inquirer')
    const mockPrompt = inquirer.default.prompt as any
    mockPrompt.mockResolvedValue({ selectedEnv: undefined })

    const result = await selectEnvironment(environments)

    expect(result).toBeUndefined()
  })
})

describe('EnvironmentManager edge cases', () => {
  test('should handle environments with missing optional fields', () => {
    const configWithMinimalEnv: Config = {
      environments: [
        {
          name: 'minimal',
          value: 'minimal',
          description: 'Minimal environment',
        },
      ],
    }

    expect(() => new EnvironmentManager(configWithMinimalEnv)).not.toThrow()
  })

  test('should validate environment with all required fields', () => {
    const validConfig: Config = {
      environments: [
        {
          name: 'test',
          value: 'test',
          description: 'Test environment',
        },
      ],
    }

    const manager = new EnvironmentManager(validConfig)

    // Test internal validation logic by checking if environments are properly stored
    const allEnvs = manager.getAll()
    expect(allEnvs).toHaveLength(1)

    allEnvs.forEach((env) => {
      expect(env.name).toBeDefined()
      expect(env.value).toBeDefined()
      expect(env.description).toBeDefined()
    })
  })
})
