const { cassandraClient } = require("../config/cassandra");
const redisClient = require("../config/redis");
const mongoLogger = require("../config/mongoLogger");

const BATCH_SIZE = 100000;

async function fetchBatch(offset: number) {
    const query = `SELECT * FROM the_shire.thing_data LIMIT ${BATCH_SIZE} OFFSET ${offset}`;
    try {
        const result = await cassandraClient.execute(query);
        return result.rows;
    } catch (error) {
        console.error("❌ Error en la consulta de Cassandra:", error);
        await redisClient.set(`failed_batch_${offset}`, JSON.stringify({ offset, error }));
        return [];
    }
}

module.exports = { fetchBatch };
