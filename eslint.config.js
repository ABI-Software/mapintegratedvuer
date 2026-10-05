import { includeIgnoreFile } from 'eslint/config';
import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import cypress from 'eslint-plugin-cypress';
import vue from 'eslint-plugin-vue';
import globals from 'globals';
import { fileURLToPath } from 'node:url';

const gitignorePath = fileURLToPath(new URL('.gitignore', import.meta.url));

export default [
  includeIgnoreFile(gitignorePath, { gitignoreResolution: true }),
  {
    ignores: ['dist/**', 'docs/.vitepress/**', 'docs/components/**', 'test/**', 'CHANGELOG.md'],
  },
  js.configs.recommended,
  ...vue.configs['flat/essential'],
  prettierConfig,
  {
    ...cypress.configs.recommended,
    files: ['cypress/**/*.js'],
  },
  {
    files: ['**/*.{js,vue}'],
    plugins: {
      prettier,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          trailingComma: 'all',
        },
      ],
      'arrow-body-style': 'off',
      'prefer-arrow-callback': 'off',
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'vue/multi-word-component-names': 'off',
    },
  },
];
