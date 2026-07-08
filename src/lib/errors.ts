export class RunwayError extends Error {
  public readonly code: string
  public readonly details: Record<string, unknown>

  constructor(message: string, code: string, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'RunwayError'
    this.code = code
    this.details = details
  }
}

export const ErrorCodes = {
  CONFIG_INVALID: 'CONFIG_INVALID',
  COMMAND_FAILED: 'COMMAND_FAILED',
} as const

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes]
