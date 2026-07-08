# Dev Runway

面向前端项目的交互式开发环境启动器。

Dev Runway 适合处理这几类问题：

- 在多个环境之间切换启动或构建
- 把环境值、平台值注入命令和环境变量
- 在主命令前后执行 hooks
- 暴露项目自己的 `lint`、`test`、`preview` 等自定义命令

## 文档

- 中文文档：[`docs-src/zh-CN.md`](./docs-src/zh-CN.md)
- English: [`README.md`](./README.md)
- GitHub Pages: [ICEPepsiCola.github.io/dev-runway](https://icepepsicola.github.io/dev-runway/)

## 快速开始

```bash
pnpm add -D dev-runway
npx dev-runway init
npx dev-runway start
```

## 设计定位

Dev Runway 有意保持为一个小而清晰的模型：

- `environment`：目标环境
- `selector`：一个全局选择器，加上每个环境可选的一个局部选择器
- `command`：真正执行的 shell 命令
- `hook`：主命令前后执行的命令或函数

它适合简单到中度复杂的命令编排，不追求工作流引擎式能力。

## 示例

```ts
import type { Config } from 'dev-runway'

export default {
  globalSelector: {
    name: 'platform',
    type: 'selector',
    description: '选择目标平台',
    options: [
      { label: 'Web', value: 'web' },
      { label: 'Desktop', value: 'desktop' },
    ],
  },
  defaultCommands: {
    start: {
      cmd: 'pnpm',
      args: ['run', 'dev', '--mode', '{{environment.value}}'],
      env: {
        APP_PLATFORM: '{{selectors.platform}}',
      },
    },
  },
  environments: [
    { name: 'development', value: 'development', description: '开发环境' },
    { name: 'production', value: 'production', description: '生产环境' },
  ],
} satisfies Partial<Config>
```

## 命令

- `dev-runway start`
- `dev-runway build`
- `dev-runway init`
- `dev-runway list`
- `dev-runway <custom-command>`

## License

ISC
