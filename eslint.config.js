import eslintjs from '@eslint/js';
import tseslint from 'typescript-eslint';
import {defineConfig} from 'eslint/config';
import globals from "globals";

export default defineConfig([
  {
    files: ['src/**/*.ts'],
    plugins: {
      eslint: eslintjs,
      typescript: tseslint
    },
    languageOptions: {
      globals: {
        ...globals.browser
      }
    },
    extends: [
      tseslint.configs.strict,
      eslintjs.configs.recommended
    ]
  },
]);
