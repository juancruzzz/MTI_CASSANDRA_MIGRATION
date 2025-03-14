import { elasticsearchClient } from "../config/elasticsearch";
import { logEvent } from "../services/logService";
import { ThingData } from "../models/thingData";
import { fetchBatch, FetchResult } from "./cassandraService";
import { monitorMigration } from "../utils/monitor";

const INDEX_NAME = "thing_data";

/**
 * Transforms Cassandra records into Elasticsearch format.
 * @param {ThingData[]} records - List of records to transform.
 * @returns {any[]} Transformed records for bulk indexing in Elasticsearch.
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
                geo: record.geo ? record.geo.toString("utf-8") : null,
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
 * Inserts data into Elasticsearch using bulk indexing.
 * @param {ThingData[]} records - List of records to insert.
 * @param {number} batchNumber - Batch number for tracking.
 * @returns {Promise<void>}
 */
async function insertToElasticsearch(records: ThingData[], batchNumber: number): Promise<void> {
    if (records.length === 0) return;

    const bulkBody = transformToElasticsearchFormat(records);

    try {
        const response = await elasticsearchClient.bulk({ body: bulkBody });

        if (response.body?.errors) {
            console.error("❌ Errores en la inserción de Elasticsearch", response.body.items);
            await logEvent("error", batchNumber, records.length, undefined, {
                message: "Falló la inserción en Elasticsearch",
                details: response.body.items,
            });
        } else {
            await logEvent("success", batchNumber, records.length);
        }
    } catch (error) {
        const err = error as Error;
        console.error("❌ Error crítico en Elasticsearch", err);
        await logEvent("error", batchNumber, records.length, undefined, {
            message: err.message,
            stack: err.stack,
        });
    }
}

/**
 * Handles the migration process from Cassandra to Elasticsearch.
 * @returns {Promise<void>}
 */
export async function migrateData(): Promise<void> {
    console.log("🚀 Iniciando migración de datos...");
    let pageState: string | undefined = undefined;
    let totalMigrated = 0;
    let batchNumber = 0;
    const startTime = Date.now();

    while (true) {
        console.log("🔄 Extrayendo datos desde Cassandra...");
        const fetchResult: FetchResult = await fetchBatch(pageState);
        const { rows, pageState: newPageState } = fetchResult;

        if (!rows || rows.length === 0) break;

        console.log(`📦 Insertando ${rows.length} registros en Elasticsearch...`);
        try {
            await insertToElasticsearch(rows, batchNumber);
            totalMigrated += rows.length;
            console.log(`✅ Migrados ${totalMigrated} registros en total`);
        } catch (error) {
            const err = error as Error;
            console.error("❌ Error en la migración de un lote", err);
            await logEvent("error", batchNumber, rows.length, undefined, {
                message: err.message,
                stack: err.stack,
            });
        }

        if (batchNumber % 5 === 0) {
            await monitorMigration();
        }

        if (!newPageState) break;
        pageState = newPageState;
        batchNumber++;
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.log(`🎉 Migración completada en ${duration} segundos. Total registros migrados: ${totalMigrated}`);

    await logEvent("success", batchNumber, totalMigrated, Number(duration), {
        message: `Migración finalizada en ${duration} segundos`,
    });

    console.log("📊 Finalizando monitoreo...");
    await monitorMigration();
}
