import { redisClient } from "../config/redis";

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

checkRedisLogs();
