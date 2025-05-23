import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@cued/auth";

export const { POST, GET } = toNextJsHandler(auth);
