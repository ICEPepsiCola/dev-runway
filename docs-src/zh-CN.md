# Dev Runway

面向前端项目的交互式开发环境启动器。

## 它解决什么问题

Dev Runway 适合在 shell 命令之上增加一层轻量编排：

- 交互式选择环境
- 让多个环境共用 `start` / `build` 流程
- 把环境值、选择器值注入到命令参数和环境变量
- 在主命令前后执行 hook
- 暴露项目自己的自定义命令

它适合简单到中度复杂的场景，不是工作流引擎。

## 安装

```bash
pnpm add -D dev-runway
```

## 快速开始

```bash
npx dev-runway init
npx dev-runway start
```

## 配置文件

在项目根目录创建 `runway.config.ts`：

```ts
import type { Config } from 'dev-runway'

export default {
  defaultCommands: {
    start: {
      cmd: 'pnpm',
      args: ['run', 'dev', '--mode', '{{environment.value}}'],
    },
    build: {
      cmd: 'pnpm',
      args: ['run', 'build'],
    },
  },
  environments: [
    { name: 'development', value: 'development', description: '开发环境' },
    { name: 'staging', value: 'staging', description: '预发布环境' },
    { name: 'production', value: 'production', description: '生产环境' },
  ],
} satisfies Partial<Config>
```

## 选择器

Dev Runway 支持：

- 一个可选的 `globalSelector`
- 每个环境一个可选的 `localSelector`

示例：

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
  environments: [
    {
      name: 'development',
      value: 'development',
      description: '开发环境',
      localSelector: {
        name: 'target',
        type: 'selector',
        description: '选择构建目标',
        options: [
          { label: 'ES2019', value: 'es2019' },
          { label: 'ES2022', value: 'es2022' },
        ],
      },
      commands: {
        start: {
          cmd: 'pnpm',
          args: ['run', 'dev', '--platform', '{{selectors.platform}}', '--target', '{{target}}'],
        },
      },
    },
  ],
} satisfies Partial<Config>
```

CLI 用法：

```bash
dev-runway start --platform=web --target es2022
```

同时支持：

- `--platform=web`
- `--platform web`

## Hooks

可以在主命令前后执行 hook：

```ts
globalPreHooks: [
  { type: 'command', cmd: 'pnpm', args: ['install'] },
],
globalPostHooks: [
  {
    type: 'function',
    fn: async (environment) => {
      console.log(`${environment.name} 已就绪`)
    },
  },
]
```

## 模板变量

可用占位符：

- `{{environment.value}}`
- `{{environment.name}}`
- `{{environment.description}}`
- `{{selectors.foo}}`
- `{{foo}}`，作为选择器值的简写

## 非交互模式

```bash
dev-runway build --env production --platform web
```

或者使用环境变量：

```bash
export RUNWAY_ENV_VALUE=production
export RUNWAY_SELECTOR_PLATFORM=web
dev-runway build
```

优先级：

1. 环境变量
2. 命令行参数
3. 交互式选择

## 配置合并规则

加载用户配置时：

- 对象做深合并
- 数组整体替换
- `environments` 永远整体替换默认环境

这样既保留默认值，也避免用户显式数组被隐式拼接。

## 命令

- `dev-runway start`
- `dev-runway build`
- `dev-runway init`
- `dev-runway list`
- `dev-runway <custom-command>`

## 示例

参考 [`examples/web/basic/runway.config.ts`](../examples/web/basic/runway.config.ts)。
