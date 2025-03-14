import { redisClient } from "../config/redis";
import { connectMongo, getMongoCollection } from "../config/mongo";
import { elasticsearchClient } from "../config/elasticsearch";

/**
 * Cleans up Redis by removing migration-related keys.
 */
async function cleanupRedis() {
    try {
        await redisClient.flushall();
        console.log("🧹 Redis limpiado correctamente.");
    } catch (error) {
        console.error("❌ Error al limpiar Redis:", error);
    }
}

/**
 * Cleans up MongoDB logs collection.
 */
async function cleanupMongoDB() {
    try {
        await connectMongo();
        const collection = await getMongoCollection();
        await collection.deleteMany({});
        console.log("🧹 Logs de MongoDB eliminados correctamente.");
    } catch (error) {
        console.error("❌ Error al limpiar MongoDB:", error);
    }
}

/**
 * Deletes the Elasticsearch index.
 */
async function cleanupElasticsearch() {
    try {
        await elasticsearchClient.indices.delete({ index: "thing_data" });
        console.log("🧹 Índice de Elasticsearch eliminado correctamente.");
    } catch (error) {
        console.error("❌ Error al limpiar Elasticsearch:", error);
    }
}

/**
 * Runs all cleanup operations.
 */
async function cleanupAll() {
    console.log("🚀 Iniciando proceso de limpieza...");
    await cleanupRedis();
    await cleanupMongoDB();
    await cleanupElasticsearch();
    console.log("✅ Proceso de limpieza completado.");
    process.exit(0);
}

cleanupAll();
