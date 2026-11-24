import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';
export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'src/app.ts',
      'src/engine.ts',
      'src/data.ts',
      'src/simulation.ts',
      'scripts/**',
      'tests/*.mjs',
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    rules: { ...reactHooks.configs.recommended.rules, ...jsxA11y.configs.recommended.rules },
  },
  prettier,
];
