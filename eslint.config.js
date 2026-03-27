import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importX from "eslint-plugin-import-x";

const baseRules = {
  "no-unused-vars": "off",
  "@typescript-eslint/no-unused-vars": [
    "error",
    {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_",
      caughtErrorsIgnorePattern: "^_",
      destructuredArrayIgnorePattern: "^_",
    },
  ],
  "@typescript-eslint/no-explicit-any": "warn",
  "@typescript-eslint/no-floating-promises": "error",
  "@typescript-eslint/no-misused-promises": "warn",
  "no-console": "off",
  "no-throw-literal": "off",
  "import-x/order": [
    "error",
    {
      groups: ["builtin", "external", "parent", "sibling", "index", "type"],
      pathGroups: [
        {
          pattern: "@/**",
          group: "parent",
          position: "before",
        },
        {
          pattern: "@niuma-engine/**",
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
  "@typescript-eslint/consistent-type-imports": [
    "error",
    {
      prefer: "type-imports",
      fixStyle: "inline-type-imports",
    },
  ],
};

const noTypeRules = {
  "no-unused-vars": "off",
  "@typescript-eslint/no-unused-vars": "off",
  "@typescript-eslint/no-explicit-any": "off",
  "@typescript-eslint/no-floating-promises": "off",
  "@typescript-eslint/no-misused-promises": "off",
  "@typescript-eslint/consistent-type-imports": "off",
  "no-console": "off",
  "no-throw-literal": "off",
  "import-x/order": "off",
  "no-undef": "off",
};

const baseGlobals = {
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
};

export default [
  js.configs.recommended,
  // TypeScript configuration
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        project: "./tsconfig.json",
      },
      globals: baseGlobals,
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "import-x": importX,
    },
    rules: baseRules,
  },
  // OpenSpec and utility files
  {
    files: ["openspec/**/*.ts", "vitest.setup.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
      },
      globals: baseGlobals,
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "import-x": importX,
    },
    rules: noTypeRules,
  },
  // Ignore patterns
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
