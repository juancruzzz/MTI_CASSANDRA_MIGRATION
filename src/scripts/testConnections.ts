import { cassandraClient } from "../config/cassandra";
import { elasticsearchClient } from "../config/elasticsearch";
import { connectMongo, getMongoDb } from "../config/mongo";
import { redisClient } from "../config/redis";

/**
 * Prueba la conexión a Cassandra
 */
async function testCassandra() {
    try {
        await cassandraClient.connect();
        console.log("✅ Cassandra: Conexión exitosa");
    } catch (error) {
        console.error("❌ Cassandra: Error de conexión", error);
    } finally {
        await cassandraClient.shutdown();
    }
}

/**
 * Prueba la conexión a Redis
 */
async function testRedis() {
    try {
        await redisClient.set("test_connection", "OK");
        const result = await redisClient.get("test_connection");
        console.log(`✅ Redis: Conexión exitosa (${result})`);
    } catch (error) {
        console.error("❌ Redis: Error de conexión", error);
    } finally {
        await redisClient.quit();
    }
}

/**
 * Prueba la conexión a MongoDB
 */
async function testMongoDB() {
    try {
        await connectMongo(); // Asegura la conexión
        const mongoDb = getMongoDb(); // Obtiene la base de datos
        const collections = await mongoDb.listCollections().toArray();
        console.log(`✅ MongoDB: Conexión exitosa (${collections.length} colecciones encontradas)`);
    } catch (error) {
        console.error("❌ MongoDB: Error de conexión", error);
    }
}

/**
 * Prueba la conexión a Elasticsearch
 */
async function testElasticsearch() {
    try {
        const health = await elasticsearchClient.cluster.health();
        console.log(`✅ Elasticsearch: Estado del cluster - ${health.body.status}`);
    } catch (error) {
        console.error("❌ Elasticsearch: Error de conexión", error);
    }
}

/**
 * Ejecuta todas las pruebas de conexión
 */
async function runTests() {
    console.log("🔍 Probando conexiones a los servicios...\n");

    await testCassandra();
    await testRedis();
    await testMongoDB();
    await testElasticsearch();

    console.log("\n✅ Pruebas completadas.");
}

// Ejecuta las pruebas
runTests();
