import { elasticsearchClient } from "../config/elasticsearch";
import { getMongoCollection } from "../config/mongo";
import { redisClient } from "../config/redis";
import { ThingData } from "../models/";
import { fetchBatch, FetchResult } from "./cassandraService";

const BATCH_SIZE = 500;
const INDEX_NAME = "thing_data";

/**
 * Transforma los datos de Cassandra al formato de Elasticsearch
 */
function transformToElasticsearchFormat(records: ThingData[]): any[] {
    return records.reduce<any[]>((acc, record) => {
        acc.push(
            { index: { _index: INDEX_NAME, _id: `${record.thing_id}_${record.date_time}` } },
            {
                thing_id: record.thing_id,
                key: record.key,
                date_time: record.date_time,
                app_id: record.app_id,
                created_at: record.created_at,
                geo: record.geo ? record.geo.toString("utf-8") : null, // Convertir BLOB a string (manejo seguro)
                ip: record.ip,
                iv: record.iv ? record.iv.toString("hex") : null,
                model_id: record.model_id,
                value: record.value ? record.value.toString("hex") : null,
            }
        );
        return acc;
    }, []);
}

/**
 * Inserta los datos en Elasticsearch en modo bulk
 */
async function insertToElasticsearch(records: ThingData[]) {
    if (records.length === 0) return;

    const bulkBody = transformToElasticsearchFormat(records);

    try {
        const response = await elasticsearchClient.bulk({ body: bulkBody });

        if (response.body?.errors) {
            console.error("❌ Errores en la inserción de Elasticsearch", response.body.items);
            await getMongoCollection().insertOne({ 
                error: "Bulk insert failed", 
                details: response.body.items, 
                timestamp: new Date() 
            });
        }
    } catch (error) {
        console.error("❌ Error crítico en Elasticsearch", error);
        await redisClient.set("migration_error", JSON.stringify({ error, timestamp: new Date() }));
    }
}

/**
 * Proceso de migración de Cassandra a Elasticsearch
 */
export async function migrateData() {
    console.log("🚀 Iniciando migración de datos...");
    let pageState: string | undefined = undefined; // ✅ Inicializado correctamente
    let totalMigrated = 0;
    const startTime = Date.now();

    while (true) {
        console.log("🔄 Extrayendo datos desde Cassandra...");
        const fetchResult: FetchResult = await fetchBatch(pageState);
        const { rows, pageState: newPageState } = fetchResult;

        if (!rows || rows.length === 0) break; // No hay más datos

        console.log(`📦 Insertando ${rows.length} registros en Elasticsearch...`);
        try {
            await insertToElasticsearch(rows);
            totalMigrated += rows.length;
            console.log(`✅ Migrados ${totalMigrated} registros en total`);
        } catch (error) {
            console.error("❌ Error en la migración de un lote", error);
            await getMongoCollection().insertOne({ 
                error: "Migration failed", 
                details: error, 
                timestamp: new Date() 
            });
            await redisClient.set("migration_error", JSON.stringify({ error, timestamp: new Date() }));
        }

        if (!newPageState) break; // ✅ Si no hay más páginas, terminamos
        pageState = newPageState; // ✅ Se actualiza correctamente
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.log(`🎉 Migración completada en ${duration} segundos. Total registros migrados: ${totalMigrated}`);
}
