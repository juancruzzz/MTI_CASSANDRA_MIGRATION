import { redisClient } from "../config/redis";
import chalk from 'chalk';

/**
 * Retrieves and displays logs from Redis.
 */
async function checkRedisLogs() {
    try {
        const migrationStatus = await redisClient.get("migration_status");
        console.log("📊 Estado actual de la migración en Redis:", JSON.parse(migrationStatus || "{}"));

        const failedBatches = await redisClient.lrange("failed_batches", 0, -1);
        if (failedBatches.length > 0) {
            console.log("⚠️ Lotes fallidos en Redis:");
            failedBatches.forEach((batch: string, index: number) => {
                console.log(`❌ Error en lote ${index + 1}:`, JSON.parse(batch || "{}"));
            });
        } else {
            console.log("✅ No hay lotes fallidos en Redis.");
        }
    } catch (error) {
        console.error("❌ Error al recuperar logs desde Redis:", error);
    } finally {
        redisClient.quit();
    }
}

/**
 * Retrieves the number of failed batches in Redis.
 */
export async function checkRedisStatus(): Promise<void> {
    try {
        const failedBatches = await redisClient.lrange("failed_batches", 0, -1); // 🔹 Obtener todos los lotes fallidos
        const failedCount = failedBatches.length; // 🔹 Contar cuántos hay

        if (failedCount > 0) {
            console.log(chalk.red(`⚠️ Redis → Lotes fallidos: ${failedCount}`));
        } else {
            console.log(chalk.green("✅ Redis → No hay lotes fallidos"));
        }
    } catch (error) {
        console.error(chalk.red("❌ Error en Redis:"), error);
    }
}


checkRedisStatus();
