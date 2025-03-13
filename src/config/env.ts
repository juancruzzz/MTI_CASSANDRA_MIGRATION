import dotenv from "dotenv";

dotenv.config();

export const env = {
    cassandra: {
        contactPoints: process.env.CASSANDRA_CONTACT_POINTS?.split(",") || ["127.0.0.1"],
        datacenter: process.env.CASSANDRA_DATACENTER || "datacenter1",
        keyspace: process.env.CASSANDRA_KEYSPACE || "the_shire",
        user: process.env.CASSANDRA_USER || "",
        password: process.env.CASSANDRA_PASSWORD || "",
    },
    elasticsearch: {
        node: process.env.ELASTICSEARCH_NODE || "http://localhost:9200",
        user: process.env.ELASTICSEARCH_USER || "",
        password: process.env.ELASTICSEARCH_PASSWORD || ""
    },
    redis: {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: parseInt(process.env.REDIS_PORT || "6379", 10),
        password: process.env.REDIS_PASSWORD || ""
    },
    mongo: {
        uri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/",
        dbName: process.env.MONGO_DB || "migration_logs",
        collection: process.env.MONGO_COLLECTION || "logs",
        user: process.env.MONGO_USER || "",
        password: process.env.MONGO_PASSWORD || ""
    }
};
