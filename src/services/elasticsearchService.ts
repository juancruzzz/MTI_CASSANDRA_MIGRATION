import { elasticsearchClient } from "../config/elasticsearch";
import { ThingData } from "../models/";

const INDEX_NAME = "thing_data_index";

/**
 * 📌 Indexa un lote en Elasticsearch
 */
export async function indexBatchToElasticsearch(batch: ThingData[]) {
  if (batch.length === 0) return;

  const body = batch.flatMap(doc => [
    { index: { _index: INDEX_NAME, _id: `${doc.thing_id}_${doc.date_time}` } },
    doc
  ]);

  try {
    const { body: bulkResponse } = await elasticsearchClient.bulk({ body });

    if (bulkResponse.errors) {
      console.error("❌ Error en la indexación:", bulkResponse.errors);
    }
  } catch (error) {
    console.error("❌ Error al indexar en Elasticsearch:", error);
  }
}
