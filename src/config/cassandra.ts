import cassandra from "cassandra-driver";
import { env } from "./env";

const authProvider = env.cassandra.user
    ? new cassandra.auth.PlainTextAuthProvider(env.cassandra.user, env.cassandra.password)
    : undefined;

export const cassandraClient = new cassandra.Client({
    contactPoints: env.cassandra.contactPoints,
    localDataCenter: env.cassandra.datacenter,
    keyspace: env.cassandra.keyspace,
    authProvider
});

export async function connectCassandra() {
    try {
        await cassandraClient.connect();
        console.log("✅ Cassandra conectado correctamente");
    } catch (error) {
        console.error("❌ Error al conectar con Cassandra:", error);
        process.exit(1);
    }
}
