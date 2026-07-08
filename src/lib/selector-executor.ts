import inquirer from 'inquirer'
import chalk from 'chalk'
import { RunwayError, ErrorCodes } from './errors'
import type { SelectorConfig, SelectorOption } from '@/config'

export class SelectorExecutor {
  /**
   * 执行选择器（全局或局部）
   */
  async executeSelector(selector: SelectorConfig): Promise<string> {
    if (!selector.options || selector.options.length === 0) {
      throw new RunwayError(
        'Selector 必须指定 options 属性',
        ErrorCodes.CONFIG_INVALID,
      )
    }

    console.log(chalk.cyan(`🎯 ${selector.description}`))

    // 显示选择提示
    const { selectedOption } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedOption',
        message: selector.description,
        choices: selector.options.map((option: SelectorOption) => ({
          name: option.label,
          value: option.value,
        })),
      },
    ])

    // 找到选中的选项
    const selected = selector.options.find((option: SelectorOption) => option.value === selectedOption)
    if (!selected) {
      throw new RunwayError(
        `未找到选中的选项: ${selectedOption}`,
        ErrorCodes.CONFIG_INVALID,
      )
    }

    console.log(chalk.green(`✅ 选择了: ${selected.label}`))

    return selectedOption
  }
}
