import { cassandraClient } from "../config/cassandra";
import { ThingData } from "../models/thingData";

const BATCH_SIZE = 100000;

/**
 * Interface for fetch result from Cassandra.
 */
export interface FetchResult {
    rows: ThingData[];
    pageState?: string;
}

/**
 * Fetches a batch of records from Cassandra.
 * @param {string} [pageState] - The paging state for fetching the next batch.
 * @returns {Promise<FetchResult>} The fetched records and paging state.
 */
export async function fetchBatch(pageState?: string): Promise<FetchResult> {
    const query = "SELECT * FROM the_shire.thing_data";
    
    try {
        const result = await cassandraClient.execute(query, [], { prepare: true, fetchSize: BATCH_SIZE, pageState });
        console.log(`✅ Datos extraídos: result.rowLength: ${result.rowLength},  result.pageState: ${ result.pageState}`);

        const rows: ThingData[] = result.rows.map(row => ({
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
        }));

        return {
            rows,
            pageState: result.pageState || undefined,
        };

    } catch (error) {
        console.error("❌ Error al extraer datos de Cassandra:", error);
        return { rows: [], pageState: undefined };
    }
}
