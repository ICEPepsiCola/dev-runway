import { defineConfig } from 'tsdown'
import { resolve } from 'path'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node16',
  outDir: 'dist',
  clean: true,
  minify: false,
  sourcemap: true,
  banner: {
    js: '#!/usr/bin/env node'
  },
  // 不打包依赖，保持外部引用
  external: [
    'chalk',
    'commander', 
    'inquirer',
    'ora'
  ],
  // 路径映射
  alias: {
    '@': resolve('./src')
  }
})