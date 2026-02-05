import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

export default defineConfig(
  // Global ignores
  {
    ignores: ['out/**', 'dist/**', 'rust/**', 'src/renderer/wasm/**', '*.config.*']
  },

  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  // React Hooks
  {
    plugins: {
      'react-hooks': reactHooks
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn'
    }
  },

  // Project-wide settings
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2025
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      // Relax some rules for practical development
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-object-type': 'off',
      'no-constant-condition': ['error', { checkLoops: false }],
      'prefer-const': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }]
    }
  },

  // Worker files get worker globals
  {
    files: ['src/renderer/workers/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.worker
      }
    }
  },

  // Prettier must be last to disable conflicting formatting rules
  prettier
)
