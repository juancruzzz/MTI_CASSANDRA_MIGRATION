import { cassandraClient } from "../config/cassandra";
import { ThingData } from "../models/";

const BATCH_SIZE = 100000; // Tamaño del lote
interface FetchResult {
    rows: ThingData[];
    pagingState?: string;
}

export async function fetchBatch(offset: number): Promise<FetchResult> {
    const query = `SELECT * FROM the_shire.thing_data LIMIT ${BATCH_SIZE} OFFSET ${offset}`;
    try {
        const result = await cassandraClient.execute(query);
        return {
            rows: result.rows.map(row => ({
                thing_id: row["thing_id"],
                key: row["key"],
                date_time: row["date_time"],
                app_id: row["app_id"],
                created_at: row["created_at"],
                geo: row["geo"],
                ip: row["ip"],
                iv: row["iv"],
                model_id: row["model_id"],
                value: row["value"]
            })) as ThingData[],
            pagingState: result.pageState,
        };
    } catch (error) {
        console.error("❌ Error al extraer datos de Cassandra:", error);
        return { rows: [] };
    }
}
