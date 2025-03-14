import { ThingData } from "../models/thingData";

import { QueryOptions, types } from "cassandra-driver";
import { cassandraClient } from "../config/cassandra";
const { TimeUuid } = types;

const NUM_RECORDS: number = 5_000_000;
const BATCH_SIZE: number = 500;
const MAX_RETRIES: number = 3;
const CONCURRENT_BATCHES: number = 5;
const TESTING = true;
const DBNAME = TESTING ? "the_shire.thing_data_test" : "the_shire.thing_data";
/**
 * Generates a random thing_id (TEXT)
 */
function getRandomThingId (): string {
  return `thing_${ Math.floor(Math.random() * 99999) }`;
}

/**
 * Generates a random key (TEXT)
 */
function getRandomKey (): string {
  return `sensor_${ Math.floor(Math.random() * 100) }`;
}

/**
 * Generates a valid app_id (ASCII)
 */
function getRandomAppId (): string {
  return `app${ Math.floor(Math.random() * 10) }`;
}

/**
 * Generates a random geographic location (BLOB)
 */
function getRandomGeo (): Buffer {
  return Buffer.from(JSON.stringify({ lat: 40.7128, lon: -74.0060 }));
}

/**
 * Generates a random BLOB value
 */
function getRandomBlob (size = 16): Buffer {
  return Buffer.alloc(size, Math.floor(Math.random() * 256));
}

/**
 * Generates a valid IP address (INET)
 */
function getRandomIp (): string {
  return `${ Math.floor(Math.random() * 256) }.${ Math.floor(Math.random() * 256) }.${ Math.floor(Math.random() * 256) }.${ Math.floor(Math.random() * 256) }`;
}

/**
 * Inserts a batch into Cassandra with retries in case of failure
 */
async function insertBatch (records: ThingData[], attempt = 1): Promise<void> {
  const query = `
        INSERT INTO ${DBNAME} (thing_id, key, date_time, app_id, created_at, geo, ip, iv, model_id, value) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

  const batchQueries = records.map(record => ({
    query,
    params: [
      record.thing_id,
      record.key,
      record.date_time,
      record.app_id,
      record.created_at,
      record.geo,
      record.ip,
      record.iv,
      record.model_id,
      record.value
    ]
  }));

  try {
    await cassandraClient.batch(batchQueries, { prepare: true });
  } catch (error) {
    console.error(`❌ Error en el batch (Intento ${ attempt }/${ MAX_RETRIES }):`, error);
    if (attempt < MAX_RETRIES) {
      console.log(`🔄 Reintentando batch...`);
      await insertBatch(records, attempt + 1);
    } else {
      throw new Error("🔥 Error crítico tras múltiples intentos, abortando.");
    }
  }
}

/**
 * Counts all records in Cassandra using efficient pagination
 */
async function countAllRecords (): Promise<number> {
  let totalRecords = 0;
  let pagingState = null;
  const pageSize = 100000;

  do {
    const options: QueryOptions = pagingState
      ? { fetchSize: pageSize, pageState: pagingState }
      : { fetchSize: pageSize };

    const result: types.ResultSet = await cassandraClient.execute(
      `SELECT thing_id FROM ${DBNAME};`,
      [],
      options
    );

    totalRecords += result.rowLength;
    pagingState = result.pageState;
    console.log(`📊 Registros contados hasta ahora: ${ totalRecords.toLocaleString() }`);
  } while (pagingState);

  console.log(`✅ Total de registros en Cassandra: ${ totalRecords.toLocaleString() }`);
  return totalRecords;
}

/**
 * Generates data and inserts it into Cassandra using concurrent batches
 */
async function generateData () {
  console.log("🚀 Verificando registros existentes...");
  const insertedRecords = await countAllRecords();

  if (insertedRecords >= NUM_RECORDS) {
    console.log("✅ Ya se insertaron todos los registros. No es necesario continuar.");
    process.exit(0);
  }

  console.log(`🔄 Continuando la inserción desde ${ insertedRecords.toLocaleString() } hasta ${ NUM_RECORDS.toLocaleString() }...`);
  let totalInserted = insertedRecords;
  const startTime = Date.now();

  while (totalInserted < NUM_RECORDS) {
    const batches = [];
    const batchStartTime = Date.now();

    for (let i = 0; i < CONCURRENT_BATCHES && totalInserted < NUM_RECORDS; i++) {
      const batch: ThingData[] = [];
      for (let j = 0; j < BATCH_SIZE && totalInserted < NUM_RECORDS; j++) {
        batch.push({
          thing_id: getRandomThingId(),
          key: getRandomKey(),
          date_time: TimeUuid.now(),
          app_id: getRandomAppId(),
          created_at: new Date(),
          geo: getRandomGeo(),
          ip: getRandomIp(),
          iv: getRandomBlob(16),
          model_id: Math.floor(Math.random() * 1000000),
          value: getRandomBlob(16),
        });
        totalInserted++;
      }
      batches.push(insertBatch(batch));
    }

    try {
      await Promise.all(batches);
      const batchEndTime = Date.now();
      const batchDuration = ((batchEndTime - batchStartTime) / 1000).toFixed(2);
      console.log(`✅ Insertados ${ totalInserted.toLocaleString() } registros... ⏱ Duración del lote: ${ batchDuration }s`);
    } catch (error) {
      console.error("❌ Error en la inserción de lotes:", error);
      process.exit(1);
    }
  }

  const endTime = Date.now();
  const totalTime = ((endTime - startTime) / 1000).toFixed(2);
  console.log("🎉 Todos los datos han sido insertados correctamente en Cassandra.");
  console.log(`⏱ Tiempo total de ejecución: ${ totalTime }s`);
  process.exit(0);
}

generateData();
