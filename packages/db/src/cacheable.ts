import { createClient } from "redis";

const redis = createClient({
  url: process.env.REDIS_URL,
}).connect();

export class Cacheable<T> {
  private derive: () => T;
  private readonly key: string;
  private readonly ttl: number;
  private readonly skipCache: boolean;

  constructor(
    derive: () => T,
    key: string,
    skipCache: boolean = false,
    ttl: number = 15 * 60,
  ) {
    this.derive = derive;
    this.key = key;
    this.ttl = ttl;
    this.skipCache = skipCache;
  }

  private async cache(value: T) {
    await (await redis).set(this.key, JSON.stringify(value), { EX: this.ttl });
  }

  public async get(): Promise<T> {
    if (this.skipCache) {
      const result = await this.derive();
      this.cache(result); // cache result without await to avoid blocking
      return result;
    }
    const cached = await (await redis).get(this.key);
    if (cached) return JSON.parse(cached);
    const result = await this.derive();
    await this.cache(result);
    return result;
  }
}
