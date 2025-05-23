import baseConfig, { restrictEnvAccess } from "@cued/eslint-config/base";
import nextjsConfig from "@cued/eslint-config/nextjs";
import reactConfig from "@cued/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  ...restrictEnvAccess,
];
