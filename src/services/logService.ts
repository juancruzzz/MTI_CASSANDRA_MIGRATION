import { connectMongo, getMongoCollection } from "../config/mongo";
import { redisClient } from "../config/redis";

export interface LogEntry {
    type: "success" | "error";
    batchNumber: number;
    recordsMigrated: number;
    duration?: string;
    error?: LogError | null;
    timestamp: Date;
}

export interface LogError {
    message: string;
    stack?: string;
}

export interface MigrationStatus {
    progress: string;
    lastBatchMigrated: number;
    lastError?: LogError | null;
}

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
 */
export async function logEvent (
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
        duration: duration ? `${ duration } seconds` : "N/A",
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

        // Save log in MongoDB
        const collection = await getMongoCollection();
        await collection.insertOne({
            level: logType,
            message: `Batch ${ batchNumber }: ${ type.toUpperCase() }`,
            details: logDetails,
            timestamp: logEntry.timestamp,
        });

        // Update Redis with migration progress
        const migrationStatus: MigrationStatus = {
            progress: `${ ((batchNumber * recordsMigrated) / 5000000) * 100 }%`,
            lastBatchMigrated: batchNumber * recordsMigrated,
            lastError: type === "error" ? logEntry.error : null,
        };
        await redisClient.set("migration_status", JSON.stringify(migrationStatus));

        // Store failed batches only in case of error
        if (type === "error") {
            await redisClient.rpush("failed_batches", JSON.stringify(logEntry));
        }

        console.log(`📝 Log saved: ${ type.toUpperCase() } - Batch ${ batchNumber }`);
    } catch (error) {
        console.error("❌ Error logging to MongoDB/Redis:", error);
    }
}

/**
 * Retrieves logs from MongoDB and Redis.
 */
export async function getLogs (): Promise<void> {
    try {
        const collection = await getMongoCollection();
        const mongoLogs = await collection.find().toArray();
        console.log("📊 Logs in MongoDB:", mongoLogs);
    } catch (error) {
        console.error("❌ Error retrieving logs from MongoDB", error);
    }

    try {
        const redisStatus = await redisClient.get("migration_status");
        console.log("📊 Current migration status in Redis:", JSON.parse(redisStatus || "{}"));

        const failedBatches = await redisClient.lrange("failed_batches", 0, -1);
        console.log(
            "⚠️ Failed batches in Redis:",
            failedBatches.map((batch: string) => JSON.parse(batch || "{}"))
        );
    } catch (error) {
        console.error("❌ Error retrieving migration status from Redis", error);
    }
}
