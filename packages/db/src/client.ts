import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion, turbo/no-undeclared-env-vars
export const db = drizzle(process.env.DATABASE_URL!, {
  schema,
});
