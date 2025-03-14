import { connectMongo, getMongoCollection } from "../config/mongo";
import { redisClient } from "../config/redis";

/**
 * Represents a log entry for migration events.
 */
export interface LogEntry {
    type: "success" | "error";
    batchNumber: number;
    recordsMigrated: number;
    duration?: string;
    error?: LogError | null;
    timestamp: Date;
}

/**
 * Represents an error log structure.
 */
export interface LogError {
    message: string;
    stack?: string;
}

/**
 * Represents the migration status stored in Redis.
 */
export interface MigrationStatus {
    progress: string;
    lastBatchMigrated: number;
    lastError?: LogError | null;
}

/**
 * Represents log details stored in MongoDB.
 */
export interface LogDetails {
    error?: LogError;
    batchInfo?: {
        batchNumber: number;
        recordsMigrated: number;
    };
    metadata?: Record<string, unknown>;
}

/**
 * Logs an event to MongoDB and updates migration status in Redis.
 * @param {("success" | "error")} type - Type of log event.
 * @param {number} batchNumber - Batch number.
 * @param {number} recordsMigrated - Number of records migrated in this batch.
 * @param {number} [duration] - Duration of the batch process.
 * @param {any} [errorDetails] - Additional error details if applicable.
 * @returns {Promise<void>}
 */
export async function logEvent(
    type: "success" | "error",
    batchNumber: number,
    recordsMigrated: number,
    duration?: number,
    errorDetails?: any
): Promise<void> {

    await connectMongo();

    const logEntry: LogEntry = {
        type,
        batchNumber,
        recordsMigrated,
        duration: duration ? `${duration} seconds` : "N/A",
        error: errorDetails
            ? {
                  message: errorDetails.message || "Unknown Error",
                  stack: errorDetails.stack || "No stack trace",
              }
            : null,
        timestamp: new Date(),
    };

    try {
        const logType: "info" | "error" = type === "success" ? "info" : "error";

        const logDetails: LogDetails = {
            error: logEntry.error ?? undefined,
            batchInfo: { batchNumber, recordsMigrated },
        };

        const collection = await getMongoCollection();
        await collection.insertOne({
            level: logType,
            message: `Lote ${batchNumber}: ${type.toUpperCase()}`,
            details: logDetails,
            timestamp: logEntry.timestamp,
        });

        const migrationStatus: MigrationStatus = {
            progress: `${((batchNumber * recordsMigrated) / 5000000) * 100}%`,
            lastBatchMigrated: batchNumber * recordsMigrated,
            lastError: type === "error" ? logEntry.error : null,
        };
        await redisClient.set("migration_status", JSON.stringify(migrationStatus));

        if (type === "error") {
            await redisClient.rpush("failed_batches", JSON.stringify(logEntry));
        }

        console.log(`📝 Log guardado: ${type.toUpperCase()} - Lote ${batchNumber}`);
    } catch (error) {
        console.error("❌ Error al registrar logs en MongoDB/Redis:", error);
    }
}

/**
 * Retrieves logs from MongoDB and Redis.
 * @returns {Promise<void>}
 */
export async function getLogs(): Promise<void> {
    try {
        const collection = await getMongoCollection();
        const mongoLogs = await collection.find().toArray();
        console.log("📊 Logs en MongoDB:", mongoLogs);
    } catch (error) {
        console.error("❌ Error al recuperar logs de MongoDB", error);
    }

    try {
        const redisStatus = await redisClient.get("migration_status");
        console.log("📊 Estado actual de la migración en Redis:", JSON.parse(redisStatus || "{}"));

        const failedBatches = await redisClient.lrange("failed_batches", 0, -1);
        console.log(
            "⚠️ Lotes fallidos en Redis:",
            failedBatches.map((batch: string) => JSON.parse(batch || "{}"))
        );
    } catch (error) {
        console.error("❌ Error al recuperar estado de Redis", error);
    }
}
