import { includeIgnoreFile } from "eslint/config";
import js from "@eslint/js";
import cypress from "eslint-plugin-cypress";
import vue from "eslint-plugin-vue";
import globals from "globals";
import { fileURLToPath } from "node:url";

const gitignorePath = fileURLToPath(new URL(".gitignore", import.meta.url));

export default [
  includeIgnoreFile(gitignorePath),
  {
    ignores: ["dist/**", "docs/.vitepress/**", "docs/components/**"],
  },
  js.configs.recommended,
  ...vue.configs["flat/essential"],
  {
    ...cypress.configs.recommended,
    files: ["cypress/**/*.js"],
  },
  {
    files: ["**/*.{js,vue}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {},
  },
];
