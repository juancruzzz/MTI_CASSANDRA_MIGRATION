import { redisClient } from "../config/redis";
import { connectMongo, getMongoCollection } from "../config/mongo";
import { elasticsearchClient } from "../config/elasticsearch";

/**
 * Cleans up Redis by removing migration-related keys.
 */
async function cleanupRedis() {
    try {
        await redisClient.flushall();
        console.log("🧹 Redis cleaned successfully.");
    } catch (error) {
        console.error("❌ Error cleaning Redis:", error);
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
        console.log("🧹 MongoDB logs cleaned successfully.");
    } catch (error) {
        console.error("❌ Error cleaning MongoDB:", error);
    }
}

/**
 * Deletes the Elasticsearch index.
 */
async function cleanupElasticsearch() {
    try {
        await elasticsearchClient.indices.delete({ index: "thing_data" });
        console.log("🧹 Elasticsearch index deleted successfully.");
    } catch (error) {
        console.error("❌ Error cleaning Elasticsearch:", error);
    }
}

/**
 * Runs all cleanup operations.
 */
async function cleanupAll() {
    console.log("🚀 Starting cleanup process...");
    await cleanupRedis();
    await cleanupMongoDB();
    await cleanupElasticsearch();
    console.log("✅ Cleanup process completed.");
    process.exit(0);
}

cleanupAll();
