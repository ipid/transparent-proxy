import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import eslintConfigPrettier from 'eslint-config-prettier/flat'

export default defineConfig([
  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  {
    name: '基础规则',
    files: ['**/*.{js,jsx,ts,tsx}'],
    extends: [
      js.configs.recommended,

      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,

      eslintConfigPrettier,
    ],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        jsDocParsingMode: 'all',
      },
    },
  },

  {
    name: '代码风格 - TS/TSX 文件类型安全',
    files: ['**/*.{ts,tsx}'],
    rules: {
      /** 限制模板字符串里的类型：如果 obj 是个对象，则写 `${obj}` 会报错；但是 `${numberVariable}` 没事 */
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allowAny: false,
          allowBoolean: true,
          allowNever: false,
          allowNullish: true,
          allowNumber: true,
          allowRegExp: false,
        },
      ],
      '@typescript-eslint/no-unnecessary-condition': [
        'error',
        {
          allowConstantLoopConditions: 'only-allowed-literals',
        },
      ],
    },
  },
])
