/**
 * Adds `.jsx`, `.ts` and `.tsx` as an extension, and enables JSX/TSX parsing.
 */

const allExtensions = ['.ts', '.tsx', '.d.ts', '.js', '.jsx'];

module.exports = {

  settings: {
    'import/extensions': allExtensions,
    'import/external-module-folders': ['node_modules', 'node_modules/@types'],
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx', '.d.ts'],
    },
    'import/resolver': {
      'node': {
        'extensions': allExtensions,
      },
    },
  },

  rules: {
    // analysis/correctness

    // TypeScript compilation already ensures that named imports exist in the referenced module
    'import/named': 'off',
  },
};
