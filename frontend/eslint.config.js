import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";

export default [
  {
    // ⛔ 这个必须放在最前面
    ignores: [
      "dist/**",
      "build/**",
      "node_modules/**"
    ],
  },

  {
    files: ["**/*.{js,jsx}"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },

    settings: {
      react: { version: "detect" },
    },

    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
    },

    rules: {
      ...js.configs.recommended.rules,
      ...pluginReact.configs.recommended.rules,
      ...pluginReactHooks.configs.recommended.rules,

      // 关闭你项目里不需要的规则
      "react/prop-types": "off",
      "no-unused-vars": "off",
      "no-useless-catch": "off",
      "no-useless-escape": "off",
      "react/no-unescaped-entities": "off",

      // 允许 __dirname（因为你在 vite.config.js 用到了）
      "no-undef": "off",
    },
  },
];
