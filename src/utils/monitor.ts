import chalk from "chalk";
import { exec } from "child_process";
import os from "os";
import { elasticsearchClient } from "../config/elasticsearch";
import { connectMongo, getMongoCollection } from "../config/mongo";
import { redisClient } from "../config/redis";

/**
 * Retrieves the CPU usage as a percentage.
 * @returns {Promise<number>} CPU usage percentage.
 */
function getCpuUsage (): Promise<number> {
    return new Promise((resolve) => {
        const startTime = process.hrtime();
        const startUsage = process.cpuUsage();

        setTimeout(() => {
            const elapsedTime = process.hrtime(startTime);
            const elapsedUsage = process.cpuUsage(startUsage);

            const elapsedTimeMs = (elapsedTime[0] * 1000) + (elapsedTime[1] / 1e6);
            const cpuPercent = ((elapsedUsage.user + elapsedUsage.system) / 1000) / elapsedTimeMs * 100;

            resolve(parseFloat(cpuPercent.toFixed(2)));
        }, 500);
    });
}

/**
 * Logs system CPU and RAM usage in real-time.
 */
async function logSystemUsage () {
    const cpuUsage = await getCpuUsage();
    const totalMemMB = (os.totalmem() / 1024 / 1024).toFixed(2);
    const freeMemMB = (os.freemem() / 1024 / 1024).toFixed(2);
    const usedMemMB = (parseFloat(totalMemMB) - parseFloat(freeMemMB)).toFixed(2);
    const memUsagePercent = ((parseFloat(usedMemMB) / parseFloat(totalMemMB)) * 100).toFixed(2);

    console.log(
        chalk.blue(
            `💻 CPU: ${ cpuUsage.toFixed(2) }% | RAM: ${ usedMemMB }MB / ${ totalMemMB }MB (${ memUsagePercent }%)`
        )
    );
}

/**
 * Executes a shell command and logs the output.
 * @param command - Shell command to execute.
 * @param label - Label to describe the command's purpose.
 */
function runCommand (command: string, label: string): void {
    exec(command, (error, stdout) => {
        if (error) {
            console.error(chalk.red(`❌ ${ label }: Error ejecutando ${ command }`), error.message);
            return;
        }
        console.log(chalk.green(`🛠️ ${ label }: ${ stdout.split("\n")[1] || stdout }`));
    });
}

/**
 * Checks the status of the Cassandra cluster.
 */
export function checkCassandraStatus (): void {
    runCommand("docker exec ttio-cassandra nodetool status", "Cassandra Load");
}

/**
 * Checks thread performance in Cassandra.
 */
export function checkCassandraPerformance () {
    exec("docker exec ttio-cassandra nodetool tpstats", (error, stdout) => {
        if (error) {
            console.error("❌ Error ejecutando nodetool tpstats:", error.message);
            return;
        }

        const lines = stdout.split("\n");
        const readStage = lines.find(line => line.startsWith("ReadStage"));
        const nativeRequests = lines.find(line => line.startsWith("Native-Transport-Requests"));

        console.log(chalk.green(`📖 Lecturas en Cassandra: ${ readStage ? readStage.split(/\s+/)[3] : "N/A" }`));
        console.log(chalk.green(`📡 Consultas activas en Cassandra: ${ nativeRequests ? nativeRequests.split(/\s+/)[3] : "N/A" }`));
    });
}

/**
 * Retrieves the count of indexed documents in Elasticsearch.
 */
export async function checkElasticsearchStatus (): Promise<void> {
    try {
        const indexExists = await elasticsearchClient.indices.exists({ index: "thing_data" });

        if (!indexExists.body) {
            console.log(chalk.yellow("⚠️ Elasticsearch: El índice 'thing_data' no existe todavía."));
            return;
        }

        const { body } = await elasticsearchClient.count({ index: "thing_data" });
        console.log(chalk.magenta(`📌 Elasticsearch → Documentos insertados: ${ body.count }`));
    } catch (error) {
        console.error(chalk.red("❌ Error en Elasticsearch:"), error);
    }
}

/**
 * Retrieves the number of failed batches in Redis.
 */
export async function checkRedisStatus (): Promise<void> {
    try {
        const failedBatches = await redisClient.lrange("failed_batches", 0, -1); // 🔹 Obtener todos los lotes fallidos
        const failedCount = failedBatches.length; // 🔹 Contar cuántos hay

        if (failedCount > 0) {
            console.log(chalk.red(`⚠️ Redis → Lotes fallidos: ${ failedCount }`));
        } else {
            console.log(chalk.green("✅ Redis → No hay lotes fallidos"));
        }
    } catch (error) {
        console.error(chalk.red("❌ Error en Redis:"), error);
    }
}

/**
 * Retrieves the number of stored logs in MongoDB.
 */
export async function checkMongoDBStatus (): Promise<void> {
    try {
        await connectMongo();
        const collection = await getMongoCollection();
        const logCount = await collection.countDocuments();
        console.log(chalk.cyan(`📂 MongoDB → Logs almacenados: ${ logCount }`));
    } catch (error) {
        console.error(chalk.red("❌ Error en MongoDB:"), error);
    }
}

/**
 * Saves monitoring data into MongoDB.
 */
export async function saveMonitoringData (): Promise<void> {
    try {
        const collection = await getMongoCollection();
        const data = {
            timestamp: new Date(),
            cpuLoad: os.loadavg()[0],
            freeMemMB: os.freemem() / 1024 / 1024,
        };
        await collection.insertOne(data);
        console.log(chalk.green("📊 Datos de monitoreo guardados en MongoDB"));
    } catch (error) {
        console.error(chalk.red("❌ Error al guardar monitoreo en MongoDB"), error);
    }
}

/**
 * Runs the migration monitoring process.
 */
export async function monitorMigration (): Promise<void> {
    console.log(chalk.yellow("🔍 MONITOREO DE MIGRACIÓN..."));
    logSystemUsage();
    await checkElasticsearchStatus();
    await checkRedisStatus();
    await checkMongoDBStatus();
    checkCassandraStatus();
    checkCassandraPerformance();
    await saveMonitoringData();
}

/**
 * Runs the monitoring process every 30 seconds in the background.
 */
export async function monitorMigrationBackground (): Promise<void> {
    setInterval(async () => {
        console.log(chalk.green("🔍 Monitoreo en segundo plano..."));
        await monitorMigration();
    }, 30000);
}
