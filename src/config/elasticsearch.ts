import { Client } from "@elastic/elasticsearch";
import { env } from "./env";

/**
 * Elasticsearch client instance configured with environment variables.
 */
export const elasticsearchClient = new Client({
    node: env.elasticsearch.node
});
