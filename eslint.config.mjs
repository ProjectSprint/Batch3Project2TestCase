/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.node.js"],
    languageOptions: {
      sourceType: "module",
    },
    // Rules specific to Node.js files or empty to use defaults
    rules: {
      // You can add any Node.js specific rules here
    },
  },
  {
    files: ["**/*.js"],
    ignores: ["**/*.node.js", "**/*.test.js"],
    languageOptions: {
      sourceType: "module",
    },
    rules: {
      "object-shorthand": ["error", "never"],
      // Prevent logical operator shortcuts and nullish coalescing
      "no-unused-expressions": [
        "error",
        {
          allowShortCircuit: false,
          allowTernary: true,
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "LogicalExpression[operator='??']",
          message: "Nullish coalescing operator is not supported in k6",
        },
        {
          selector: "OptionalChaining",
          message: "Optional chaining (?.) is not supported in k6",
        },
        {
          selector: "PrivateIdentifier",
          message: "Private class fields are not supported in k6",
        },
      ],
      // Prevent other unsupported features
      "no-async-promise-executor": "error",
      "no-await-in-loop": "error",
      "no-console": ["error", { allow: ["log", "warn", "error"] }],
      "no-import-assign": "error",

      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["src/*"],
              message:
                "Please use relative imports instead of importing from 'src/'",
            },
          ],
        },
      ],
      // Prevent newer array methods
      "no-restricted-properties": [
        "error",
        {
          object: "Array",
          property: "flatMap",
          message: "Array.flatMap() is not supported in k6",
        },
        {
          object: "Array",
          property: "flat",
          message: "Array.flat() is not supported in k6",
        },
        {
          object: "Object",
          property: "fromEntries",
          message: "Object.fromEntries() is not supported in k6",
        },
      ],

      // Only allow supported globals
      "no-restricted-globals": [
        "error",
        {
          name: "globalThis",
          message: "globalThis is not supported in k6",
        },
      ],
    },
  },
];
