import { migrateData } from "../services/migrationService";
import { closeMongoConnection } from "../config/mongo";
import { redisClient } from "../config/redis";
import { cassandraClient } from "../config/cassandra";
import { elasticsearchClient } from "../config/elasticsearch";

/**
 * Executes the migration script and ensures connections are closed after execution.
 */
(async () => {
    try {
        console.log("🚀 Ejecutando script de migración...");
        await migrateData();
        console.log("✅ Migración finalizada con éxito.");
    } catch (error) {
        console.error("❌ Error crítico en la migración", error);
        process.exit(1);
    } finally {
        console.log("🔄 Cerrando conexiones...");

        try {
            await closeMongoConnection();
            console.log("🔌 Conexión a MongoDB cerrada.");
        } catch (error) {
            console.error("❌ Error al cerrar MongoDB:", error);
        }

        try {
            await cassandraClient.shutdown();
            console.log("🔌 Conexión a Cassandra cerrada.");
        } catch (error) {
            console.error("❌ Error al cerrar Cassandra:", error);
        }

        try {
            await elasticsearchClient.close();
            console.log("🔌 Conexión a Elasticsearch cerrada.");
        } catch (error) {
            console.error("❌ Error al cerrar Elasticsearch:", error);
        }

        redisClient.quit(() => {
            console.log("🔌 Conexión a Redis cerrada.");
            console.log("✅ Todo cerrado correctamente. Terminando el proceso...");
            process.exit(0);
        });
    }
})();
