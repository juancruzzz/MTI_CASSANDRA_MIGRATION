import { createClient } from "redis";
import { env } from "./env";

export const redisClient = createClient({
    socket: {
        host: env.redis.host,
        port: env.redis.port
    }
});

redisClient.connect().catch(console.error);
