import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Allow CommonJS-style `require()` in scripts folder used by CI and local utilities
  {
    files: ["scripts/**"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-var-requires": "off",
    },
  },
  // Allow `any` in server/api and library files where rapid prototyping uses flexible types
  {
    files: ["src/app/api/**", "src/lib/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".venv/**",
  ]),
]);

export default eslintConfig;
