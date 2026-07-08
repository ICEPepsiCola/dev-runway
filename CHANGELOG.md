# Changelog

## [0.1.1](https://github.com/ICEPepsiCola/dev-runway/compare/v0.1.0...v0.1.1) (2026-07-08)

# 0.1.0 (2026-07-08)


### Bug Fixes

* keep release workflow on a named branch ([6b4f40f](https://github.com/ICEPepsiCola/dev-runway/commit/6b4f40fb5e9ba18d214577862de25dcb75f29188))
* run release only after successful ci ([0a6d447](https://github.com/ICEPepsiCola/dev-runway/commit/0a6d4470d6e93e9793c3a13b53e13c2f3a5310a2))
* set upstream when preparing release branch ([5938a3c](https://github.com/ICEPepsiCola/dev-runway/commit/5938a3c50057a80cff92cb6d83c280a2af4a310b))


### Features

* initial release of dev-runway ([c258986](https://github.com/ICEPepsiCola/dev-runway/commit/c258986add1962b311bd79d27559a9e2c19f20b0))

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
