import { subcommandManager } from '@/lib/subcommands'
import chalk from 'chalk'

// 导出所有类型定义和变量，供用户配置文件使用
export * from '@/config'

async function main(): Promise<void> {
  // 使用新的子命令系统
  subcommandManager.parse(process.argv)
}

// 处理未捕获的异常
process.on(
  'uncaughtException',
  (error) => {
    console.error(
      chalk.red('未捕获的异常:'),
      error.message,
    )
    process.exit(1)
  },
)

process.on(
  'unhandledRejection',
  (reason) => {
    console.error(
      chalk.red('未处理的Promise拒绝:'),
      reason,
    )
    process.exit(1)
  },
)

main()
