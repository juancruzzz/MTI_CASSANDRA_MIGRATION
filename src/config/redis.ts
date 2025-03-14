import * as redis from "redis";
import { env } from "./env";

/** Redis client instance */
export const redisClient = redis.createClient(Number(env.redis.port), env.redis.host);

/**
 * Handles Redis connection events.
 */
redisClient.on("connect", () => console.log("✅ Conectado a Redis"));
redisClient.on("ready", () => console.log("✅ Redis está listo para recibir comandos"));
redisClient.on("error", (error: Error) => console.error("❌ Redis: Error de conexión", error));
redisClient.on("end", () => console.log("🔌 Conexión a Redis cerrada"));
