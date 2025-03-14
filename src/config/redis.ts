// @ts-ignore
import * as redis from "redis";
import { env } from "./env";

export const redisClient = redis.createClient(Number(env.redis.port), env.redis.host);

redisClient.on("connect", () => console.log("✅ Conectado a Redis"));
redisClient.on("ready", () => console.log("✅ Redis está listo para recibir comandos"));
redisClient.on("error", (err: any) => console.error("❌ Redis: Error de conexión", err));
redisClient.on("end", () => console.log("🔌 Conexión a Redis cerrada"));