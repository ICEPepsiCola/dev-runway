# 配置示例

## Web 项目

见 [web/basic/runway.config.ts](./web/basic/runway.config.ts)，展示：

- 多环境 `start` / `build` 命令
- 全局平台选择器 `{{selectors.platform}}`
- 自定义命令 `lint` / `test`

```bash
cd examples/web/basic
npx dev-runway start
npx dev-runway build --env=production --platform=web
npx dev-runway lint
```
