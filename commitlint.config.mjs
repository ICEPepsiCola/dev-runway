export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 类型枚举
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // 修复bug
        'docs',     // 文档更新
        'style',    // 代码格式（不影响代码运行的变动）
        'refactor', // 重构（既不是新增功能，也不是修改bug的代码变动）
        'perf',     // 性能优化
        'test',     // 增加测试
        'chore',    // 构建过程或辅助工具的变动
        'ci',       // CI配置文件和脚本的变动
        'build',    // 影响构建系统或外部依赖的更改
        'revert',   // 回滚之前的commit
      ],
    ],
    // 主题不能为空
    'subject-empty': [2, 'never'],
    // 主题不能以句号结尾
    'subject-full-stop': [2, 'never', '.'],
    // 主题格式（小写开头）
    'subject-case': [2, 'always', 'lower-case'],
    // 类型不能为空
    'type-empty': [2, 'never'],
    // 类型格式（小写）
    'type-case': [2, 'always', 'lower-case'],
    // header 最大长度
    'header-max-length': [2, 'always', 100],
    // body 每行最大长度
    'body-max-line-length': [2, 'always', 200],
    // footer 每行最大长度
    'footer-max-line-length': [2, 'always', 100],
  },
}
