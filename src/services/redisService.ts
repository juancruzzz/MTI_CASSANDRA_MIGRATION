import { redisClient } from "../config/redis";

/**
 * 📌 Guarda el progreso en Redis
 */
export async function logProgress(offset: number) {
  await redisClient.set("migration_progress", offset.toString());
}

/**
 * 📌 Obtiene el último progreso guardado
 */
export async function getLastProgress(): Promise<number> {
  const lastOffset = await redisClient.get("migration_progress");
  return lastOffset ? parseInt(lastOffset, 10) : 0;
}
