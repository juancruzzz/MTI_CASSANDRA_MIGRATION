import { Client } from "@elastic/elasticsearch";
import { env } from "./env";

export const elasticsearchClient = new Client({
    node: env.elasticsearch.node,
    ...(env.elasticsearch.user && env.elasticsearch.password
        ? { auth: { username: env.elasticsearch.user, password: env.elasticsearch.password } }
        : {})
});
