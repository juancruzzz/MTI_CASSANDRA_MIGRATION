import { cassandraClient } from "../config/cassandra";
import { ThingData } from "../models/";

const BATCH_SIZE = 100000; // Tamaño del lote

export interface FetchResult {
    rows: ThingData[];
    pageState?: string;
}
async function countRecords() {
    let total = 0;
    let pageState: string | undefined = undefined;
    const pageSize = 10000; // Tamaño de lotes

    do {
        const result: any = await cassandraClient.execute(
            `SELECT thing_id FROM the_shire.thing_data`,
            [],
            { fetchSize: pageSize, pageState }
        );

        total += result.rowLength;
        pageState = result.pageState;
    } while (pageState);

    console.log(`📊 Total de registros en Cassandra: ${total}`);
    return total;
}


export async function fetchBatch(pageState?: string): Promise<FetchResult> {
    const query = `SELECT * FROM the_shire.thing_data`;
    
    try {
        // ✅ Ejecuta la consulta con `await`
        const result = await cassandraClient.execute(query, [], { prepare: true, fetchSize: BATCH_SIZE, pageState });
        console.log("✅ DATOS EXTRAIDOS", result.rowLength, result.pageState);
        // ✅ Mapea correctamente los datos de Cassandra a `ThingData[]`
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
            pageState: result.pageState || undefined, // ✅ `undefined` en lugar de `null`
        };

    } catch (error) {
        console.error("❌ Error al extraer datos de Cassandra:", error);
        return { rows: [], pageState: undefined };
    }
}
