import js from '@eslint/js'
import globals from 'globals'

export default [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'data/**',
      '.tmp/**',
      'coverage/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
]
