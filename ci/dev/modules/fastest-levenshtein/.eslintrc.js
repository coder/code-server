"use strict";
module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2020: true,
  },
  extends: ["eslint:all", "prettier", "plugin:node/recommended"],
  parserOptions: {
    ecmaVersion: 11,
  },
  rules: {
    camelcase: "off",
    "capitalized-comments": "off",
    curly: ["error", "all"],
    "id-length": "off",
    "max-lines-per-function": "off",
    "max-statements": "off",
    "multiline-comment-style": "off",
    "no-bitwise": "off",
    "no-magic-numbers": "off",
    "no-param-reassign": "off",
    "no-plusplus": "off",
    "one-var": "off",
    "padded-blocks": "off",
  },
};
