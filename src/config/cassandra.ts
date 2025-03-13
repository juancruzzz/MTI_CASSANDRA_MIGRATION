import cassandra from "cassandra-driver";
import { env } from "./env";

export const cassandraClient = new cassandra.Client({
  contactPoints: env.cassandra.contactPoints,
  localDataCenter: env.cassandra.datacenter,
  keyspace: env.cassandra.keyspace,
  credentials: { username: env.cassandra.user, password: env.cassandra.password }
});

/**
 * Connects to Cassandra.
 * @returns {Promise<void>}
 */
export function connectCassandra () {
  return cassandraClient.connect()
    .then(() => {
      console.log("✅ Cassandra conectado correctamente");
    })
    .catch((error: Error) => {
      console.error("❌ Error al conectar con Cassandra:", error);
      process.exit(1);
    });
}