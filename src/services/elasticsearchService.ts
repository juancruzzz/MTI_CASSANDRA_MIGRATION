import { elasticsearchClient } from "../config/elasticsearch";
import { ThingData } from "../models/thingData";

const INDEX_NAME = "thing_data_index";

/**
 * Indexes a batch of documents into Elasticsearch.
 * @param {ThingData[]} batch - The batch of records to be indexed.
 * @returns {Promise<void>}
 */
export async function indexBatchToElasticsearch(batch: ThingData[]): Promise<void> {
    if (batch.length === 0) return;

    const body = batch.reduce<any[]>((acc, doc) => {
        acc.push(
            { index: { _index: INDEX_NAME, _id: `${doc.thing_id}_${doc.date_time}` } },
            doc
        );
        return acc;
    }, []);

    try {
        const { body: bulkResponse } = await elasticsearchClient.bulk({ body });

        if (bulkResponse.errors) {
            console.error("❌ Error en la indexación:", bulkResponse.errors);
        }
    } catch (error) {
        console.error("❌ Error al indexar en Elasticsearch:", error);
    }
}
