import { config } from "@remotion/eslint-config-flat";

export default [
  ...config,
  {
    files: ["src/**/*.mjs"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
      },
    },
  },
];
