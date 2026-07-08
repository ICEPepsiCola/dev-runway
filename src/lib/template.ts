import type { Environment } from '@/config'

export interface TemplateContext {
  environment: Environment
  selectors?: Record<string, string>
}

export function replaceTemplateString(str: string, context: TemplateContext): string {
  const envValue = process.env.RUNWAY_ENV_VALUE || context.environment.value
  const envName = process.env.RUNWAY_ENV_NAME || context.environment.name
  const envDescription = process.env.RUNWAY_ENV_DESCRIPTION || context.environment.description

  let result = str
    .replace(/\{\{environment\.value\}\}/g, envValue)
    .replace(/\{\{environment\.name\}\}/g, envName)
    .replace(/\{\{environment\.description\}\}/g, envDescription)

  for (const [selectorName, value] of Object.entries(context.selectors ?? {})) {
    const resolved = process.env[`RUNWAY_SELECTOR_${selectorName.toUpperCase()}`] || value
    result = result.replace(new RegExp(`\\{\\{selectors\\.${selectorName}\\}\\}`, 'g'), resolved)
    result = result.replace(new RegExp(`\\{\\{${selectorName}\\}\\}`, 'g'), resolved)
  }

  return result
}

export function replaceTemplateVariables(args: string[], context: TemplateContext): string[] {
  return args.map((arg) => replaceTemplateString(arg, context))
}

export function replaceTemplateEnv(
  env: Record<string, string>,
  context: TemplateContext,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(env).map(([key, value]) => [key, replaceTemplateString(value, context)]),
  )
}
