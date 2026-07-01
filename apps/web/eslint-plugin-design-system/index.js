/** @type {import('eslint').ESLint.Plugin} */
module.exports = {
  rules: {
    'no-raw-palette-classes': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Disallow raw Tailwind gray/slate palette utility classes',
        },
        schema: [],
      },
      create(context) {
        const pattern =
          /\b(?:bg|text|border|divide|ring|from|via|to|fill|stroke|outline|decoration|shadow|placeholder)-(?:gray|slate)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/;

        function checkString(value, node) {
          if (pattern.test(value)) {
            context.report({
              node,
              message:
                'Use semantic design tokens (bg-muted, text-foreground, border-border, etc.) instead of raw gray/slate palette classes.',
            });
          }
        }

        return {
          Literal(node) {
            if (typeof node.value === 'string') checkString(node.value, node);
          },
          TemplateElement(node) {
            checkString(node.value.raw, node);
          },
        };
      },
    },
  },
};
