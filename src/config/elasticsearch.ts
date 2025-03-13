import { Client } from "@elastic/elasticsearch";
import { env } from "./env";

export const elasticsearchClient = new Client({
    node: env.elasticsearch.node
});
