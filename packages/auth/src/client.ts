/* eslint-disable no-restricted-properties */
import { createAuthClient } from "better-auth/react";

export default createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
});
