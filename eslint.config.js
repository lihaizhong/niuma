import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importX from "eslint-plugin-import-x";

export default [
  js.configs.recommended,
  {
    files: ["niuma/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        project: "./tsconfig.json",
      },
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        AbortController: "readonly",
        AbortSignal: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        global: "readonly",
        fetch: "readonly",
        NodeJS: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "import-x": importX,
    },
    rules: {
      // 未使用变量检查 - 忽略下划线前缀的参数（用于接口/回调）
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_",
          "destructuredArrayIgnorePattern": "^_"
        }
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "warn",
      "no-console": "off",
      "no-throw-literal": "off",

      // Import 排序规则
      // 顺序：1. Node.js 内置模块 2. 第三方库 3. 本地模块（父级）4. 本地模块（同级）
      "import-x/order": [
        "error",
        {
          groups: [
            "builtin",   // Node.js 内置模块 (fs, path, http 等)
            "external",  // 第三方库 (cac, langchain 等)
            "parent",    // 父级相对导入 (../xxx)
            "sibling",   // 同级相对导入 (./xxx)
            "index",     // 当前目录 index
            "type",      // type imports 放最后
          ],
          pathGroups: [
            {
              pattern: "@/**",
              group: "parent",
              position: "before",
            },
          ],
          pathGroupsExcludedImportTypes: ["type"],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
      // 要求 type imports 使用 import type 语法
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],
    },
  },
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "**/*.config.js",
      "**/*.config.ts",
      ".next/**",
      "public/**",
      "coverage/**",
      ".eslint-cache",
    ],
  },
];
