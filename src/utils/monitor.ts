import { exec } from "child_process";
import os from "os";
import chalk from "chalk";
import { elasticsearchClient } from "../config/elasticsearch";
import { redisClient } from "../config/redis";
import { connectMongo, getMongoCollection } from "../config/mongo";

/**
 * Logs system CPU and RAM usage in a compact format.
 */
export function logSystemUsage() {
    const cpuLoad = os.loadavg()[0].toFixed(2);
    const freeMemMB = (os.freemem() / 1024 / 1024).toFixed(2);
    console.log(chalk.blue(`💻 CPU: ${cpuLoad} | RAM Libre: ${freeMemMB} MB`));
}

/**
 * Executes a shell command asynchronously and logs the output.
 */
function runCommand(command: string, label: string) {
    exec(command, (error, stdout) => {
        if (error) {
            console.error(chalk.red(`❌ ${label}: Error ejecutando ${command}`), error.message);
            return;
        }
        console.log(chalk.green(`🛠️ ${label}: ${stdout.split("\n")[1] || stdout}`));
    });
}

/**
 * Checks Cassandra cluster status.
 */
export function checkCassandraStatus() {
    runCommand("docker exec ttio-cassandra nodetool status", "Cassandra Load");
}

/**
 * Checks Cassandra thread performance.
 */
export function checkCassandraPerformance() {
    runCommand("docker exec ttio-cassandra nodetool tpstats", "Cassandra Latency");
}

/**
 * Gets the count of indexed documents in Elasticsearch.
 */
export async function checkElasticsearchStatus() {
    try {
        const indexExists = await elasticsearchClient.indices.exists({ index: "thing_data" });

        if (!indexExists.body) {
            console.log(chalk.yellow("⚠️ Elasticsearch: El índice 'thing_data' no existe todavía."));
            return;
        }

        const { body } = await elasticsearchClient.count({ index: "thing_data" });
        console.log(chalk.magenta(`📌 Elasticsearch → Documentos insertados: ${body.count}`));
    } catch (error) {
        console.error(chalk.red("❌ Error en Elasticsearch:"), error);
    }
}

/**
 * Gets the count of failed batches in Redis.
 */
export async function checkRedisStatus() {
    try {
        const failedBatches = await redisClient.llen("failed_batches");

        if (failedBatches > 0) {
            console.log(chalk.red(`⚠️ Redis → Lotes fallidos: ${failedBatches}`));
        } else {
            console.log(chalk.green("✅ Redis → No hay lotes fallidos"));
        }
    } catch (error) {
        console.error(chalk.red("❌ Error en Redis:"), error);
    }
}


/**
 * Gets the count of logs in MongoDB.
 */
export async function checkMongoDBStatus() {
    try {
        await connectMongo();
        const collection = await getMongoCollection();
        const logCount = await collection.countDocuments();
        console.log(chalk.cyan(`📂 MongoDB → Logs almacenados: ${logCount}`));
    } catch (error) {
        console.error(chalk.red("❌ Error en MongoDB:"), error);
    }
}

/**
 * Saves monitoring data to MongoDB.
 */
export async function saveMonitoringData() {
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
 * Runs the monitoring process during migration.
 */
export async function monitorMigration() {
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
 * Runs monitoring every 30 seconds without blocking migration.
 */
export async function monitorMigrationBackground() {
    setInterval(async () => {
        console.log(chalk.green("🔍 Monitoreo en segundo plano..."));
        await monitorMigration();
    }, 30000); // 🔄 Ahora cada 30 segundos
}
