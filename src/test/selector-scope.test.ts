import { describe, test, expect } from 'vitest'
import { shouldApplySelector } from '@/lib/selector-utils'
import type { SelectorConfig } from '@/config'

describe('shouldApplySelector', () => {
  test('returns false for undefined selector', () => {
    expect(shouldApplySelector(undefined, 'start')).toBe(false)
  })

  test('applies to start and build by default', () => {
    const selector: SelectorConfig = {
      type: 'selector',
      name: 'platform',
      description: '选择平台',
      options: [],
    }

    expect(shouldApplySelector(selector, 'start')).toBe(true)
    expect(shouldApplySelector(selector, 'build')).toBe(true)
    expect(shouldApplySelector(selector, 'init')).toBe(false)
    expect(shouldApplySelector(selector, 'list')).toBe(false)
  })

  test('respects appliesTo when set', () => {
    const selector: SelectorConfig = {
      type: 'selector',
      name: 'platform',
      description: '选择平台',
      options: [],
      appliesTo: ['build'],
    }

    expect(shouldApplySelector(selector, 'start')).toBe(false)
    expect(shouldApplySelector(selector, 'build')).toBe(true)
  })

  test('never applies to init or list even if listed in appliesTo', () => {
    const selector: SelectorConfig = {
      type: 'selector',
      name: 'platform',
      description: '选择平台',
      options: [],
      appliesTo: ['start', 'build', 'init', 'list'],
    }

    expect(shouldApplySelector(selector, 'init')).toBe(false)
    expect(shouldApplySelector(selector, 'list')).toBe(false)
  })
})
