# Changelog

## [2.0.0] - 2026-07-08

### Removed

- 移除 leidaibo 贡献的条件选择器系统（`conditionalSelectors`、`globalConditionalSelectors`）
- 移除 RN 假 demo 示例和 `demos/` 目录
- 移除 `GlobalSelectorExecutor` 死代码
- 移除 `defaultProjectType` 特殊逻辑
- 移除 command-executor 中 RN 硬编码（`hotfixTarget`、`buildOptions`、`runOptions`）
- 移除 `lodash-es` 依赖
- 移除未使用的 ErrorCode

### Changed

- 抽取 `template.ts` 统一模板替换（hook 现在也支持 `{{selectors.xxx}}`）
- 抽取 `selector-utils.ts` 统一选择器解析
- `executeCommand` 简化为接收 `selectors: Record<string, string>`
- `subcommands.ts` 从 540 行精简到约 250 行
- 示例精简为单个真实 Web 配置

## [1.0.0] - 2026-07-08

从 pilot-cli 重构为 dev-runway 的初始发布。
