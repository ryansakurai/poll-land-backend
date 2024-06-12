import { Redis } from "ioredis";

export const redis = new Redis(parseInt(process.env.REDIS_PORT || '6379'));
