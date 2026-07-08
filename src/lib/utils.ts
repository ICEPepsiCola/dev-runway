import type { SubcommandType } from '@/config'

/**
 * 获取子命令的描述文本
 */
export function getSubcommandDescription(subcommand: SubcommandType): string {
  switch (subcommand) {
    case 'start':
      return '启动'
    case 'build':
      return '构建'
    case 'init':
      return '初始化'
    case 'list':
      return '列出'
    default:
      return '执行'
  }
}
