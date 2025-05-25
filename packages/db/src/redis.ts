import IoRedis from "ioredis";

/* eslint-disable turbo/no-undeclared-env-vars */
export const redis = new IoRedis(`${process.env.REDIS_URL}`, {
  maxRetriesPerRequest: null,
});
