// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const angularPlugin = require('@angular-eslint/eslint-plugin');
const angularTemplatePlugin = require('@angular-eslint/eslint-plugin-template');
const templateParser = require('@angular-eslint/template-parser');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  {
    ignores: ['dist/**', 'node_modules/**', '.angular/**', 'coverage/**'],
  },

  // ── TypeScript files ────────────────────────────────────────────────────────
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.app.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      '@angular-eslint': angularPlugin,
    },
    rules: {
      ...eslint.configs.recommended.rules,
      ...tseslint.configs['recommended'].rules,

      // no-undef tắt cho TS files — TypeScript compiler xử lý tốt hơn,
      // tránh false positive với browser globals (window, console, ...)
      'no-undef': 'off',

      // ── TypeScript — cứng ──────────────────────────────────────────────────
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // ── Angular — cứng ─────────────────────────────────────────────────────
      /** Bắt buộc OnPush trên mọi component */
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',

      /** Cấm inline template / styles trong @Component */
      '@angular-eslint/component-max-inline-declarations': [
        'error',
        { template: 0, styles: 0, animations: 5 },
      ],

      /** Selector phải theo chuẩn app-kebab-case */
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],

      /** Bắt buộc khai báo implements lifecycle interface */
      '@angular-eslint/use-lifecycle-interface': 'error',

      /** Cấm lifecycle method rỗng */
      '@angular-eslint/no-empty-lifecycle-method': 'error',
    },
  },

  // ── HTML template files ─────────────────────────────────────────────────────
  {
    files: ['**/*.html'],
    languageOptions: {
      parser: templateParser,
    },
    plugins: {
      '@angular-eslint/template': angularTemplatePlugin,
    },
    rules: {
      /** Cấm dùng *ngIf / *ngFor — phải dùng @if / @for (Angular 17+) */
      '@angular-eslint/template/prefer-control-flow': 'error',

      /** Không dùng [innerHTML] thô — phải qua safeHtml pipe */
      '@angular-eslint/template/no-any': 'error',

      /** Các rule template cơ bản */
      '@angular-eslint/template/no-negated-async': 'error',
      '@angular-eslint/template/use-track-by-function': 'warn',
    },
  },
];
