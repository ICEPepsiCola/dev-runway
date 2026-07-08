import chalk from 'chalk'
import type { GlobalSelector, SubcommandType } from '@/config'
import type { SelectorExecutor } from './selector-executor'

export function shouldApplySelector(
  selector: { appliesTo?: SubcommandType[] } | undefined,
  subcommand: SubcommandType,
): boolean {
  if (!selector) return false
  if (subcommand === 'list' || subcommand === 'init') return false
  if (selector.appliesTo) return selector.appliesTo.includes(subcommand)
  return true
}

export async function resolveSelectorValue(
  selector: GlobalSelector,
  cliSelectors: Record<string, string> | undefined,
  executor: SelectorExecutor,
): Promise<string> {
  const envVarName = `RUNWAY_SELECTOR_${selector.name.toUpperCase()}`
  const envValue = process.env[envVarName]

  if (envValue) {
    console.log(chalk.blue(`使用环境变量 ${envVarName}: ${envValue}`))
    return envValue
  }

  const cliValue = cliSelectors?.[selector.name]
  if (cliValue) {
    console.log(chalk.blue(`使用命令行指定的 ${selector.name}: ${cliValue}`))
    return cliValue
  }

  return executor.executeSelector(selector)
}
