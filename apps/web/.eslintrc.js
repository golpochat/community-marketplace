/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: 'next/core-web-vitals',
  plugins: ['design-system'],
  rules: {
    'design-system/no-raw-palette-classes': 'warn',
  },
};
