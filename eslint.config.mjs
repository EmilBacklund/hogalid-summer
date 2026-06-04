import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import next from '@next/eslint-plugin-next';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    // Build artifacts and the old Vite app (ported & removed across Sessions 2–10).
    ignores: [
      '.next/**',
      '.netlify/**',
      'next-env.d.ts',
      'dist/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'src/**/*.jsx',
      'src/**/*.js',
      'netlify/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  jsxA11y.flatConfigs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      '@next/next': next,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...next.configs.recommended.rules,
      ...next.configs['core-web-vitals'].rules,
    },
  },
  prettier,
);
