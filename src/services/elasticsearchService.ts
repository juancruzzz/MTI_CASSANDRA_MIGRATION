import { elasticsearchClient } from "../config/elasticsearch";
import { ThingData } from "../models/thingData";

const INDEX_NAME = "thing_data_index";

/**
 * 📌 Indexa un lote en Elasticsearch
 */
export async function indexBatchToElasticsearch (batch: ThingData[]) {
  if (batch.length === 0) return;

  const body = batch.reduce<any[]>((acc, doc) => {
    acc.push(
      { index: { _index: INDEX_NAME, _id: `${ doc.thing_id }_${ doc.date_time }` } },
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
