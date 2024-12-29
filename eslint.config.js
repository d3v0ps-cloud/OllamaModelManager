import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        TextDecoder: 'readonly',
        setTimeout: 'readonly',
        // Functions defined in HTML
        updateSelectedModels: 'readonly',
        updateSelectedModelsInBulk: 'readonly',
        displayModels: 'readonly',
        formatBytes: 'readonly',
        refreshModels: 'readonly',
        // Node.js globals
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        exports: 'readonly',
        module: 'readonly',
        require: 'readonly',
      },
    },
    rules: {
      // Additional custom rules
      'no-unused-vars': 'warn',
      'no-console': 'off', // Allow console for server-side logging
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
    },
    // Files to lint
    files: ['**/*.js'],
    // Files to ignore
    ignores: ['node_modules/**', 'build/**', 'dist/**'],
  },
];
