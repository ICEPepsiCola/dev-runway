import stylistic from "@stylistic/eslint-plugin";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";

export default [
  {
    ignores: [
      "dist/**",
      "bin/**",
      "test/**/*.ts",
      "*.config.js",
      "eslint.config.js",
      "commitlint.config.mjs"
    ],
  },
  // 拒绝 JavaScript 文件存在
  {
    files: ["**/*.{js,mjs,cjs}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Program",
          message: "JavaScript files (.js, .mjs, .cjs) are not allowed in this project. Please use TypeScript (.ts) instead.",
        },
      ],
    },
  },
  // TypeScript 文件配置
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@stylistic": stylistic,
      "@typescript-eslint": tseslint,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.eslint.json",
      },
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // 基础 ESLint 规则
      "no-console": ["warn", { allow: ["warn", "error", "info", "log"] }],
      "no-unused-vars": "off", // 使用 TypeScript 版本的规则

      // TypeScript 规则
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": "error",

      // 代码风格规则
      '@stylistic/indent': ['error', 2],
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/semi': ['error', 'never'],
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/object-curly-spacing': ['error', 'always'],
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/brace-style': ['error', '1tbs'],
      '@stylistic/type-annotation-spacing': ['error', {
        before: false,
        after: true,
        overrides: {
          arrow: {
            before: true,
            after: true,
          },
          colon: {
            before: false,
            after: true,
          },
        },
      }],
      // 等号、加号等运算符两侧必须有空格
      '@stylistic/space-infix-ops': ['error'],
      // 冒号前后空格控制
      '@stylistic/key-spacing': ['error', {
        beforeColon: false,
        afterColon: true,
        mode: 'strict'
      }],

      // 函数参数换行规则 - 智能换行
      '@stylistic/function-paren-newline': ['error', 'multiline-arguments'],



      // 函数参数和返回类型换行
      '@stylistic/function-call-spacing': ['error', 'never'],

      // 对象属性换行规则
      '@stylistic/object-curly-newline': ['error', {
        // ObjectExpression: { multiline: true, minProperties: 4 },
        ObjectPattern: { multiline: true, minProperties: 4 },
        ImportDeclaration: { multiline: true, minProperties: 6 },
        ExportDeclaration: { multiline: true, minProperties: 6 }
      }],
      '@stylistic/object-property-newline': ['error', {
        allowAllPropertiesOnSameLine: true
      }],

      // 数组元素换行规则
      '@stylistic/array-element-newline': ['error', 'consistent'],
      '@stylistic/array-bracket-newline': ['error', 'consistent'],

      // 导入导出换行规则
      '@stylistic/max-len': ['error', {
        code: 120,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true,
        ignoreComments: true,
        ignorePattern: '^\\s*//.*$' // 忽略注释行
      }],

      // 函数调用参数换行 - 保持一致性，但允许手动换行
      '@stylistic/function-call-argument-newline': ['error', 'consistent'],

      // 当函数参数过长时自动换行
      '@stylistic/wrap-iife': ['error', 'inside'],
      '@stylistic/newline-per-chained-call': ['error', { ignoreChainWithDepth: 3 }]
    },
  },
];
