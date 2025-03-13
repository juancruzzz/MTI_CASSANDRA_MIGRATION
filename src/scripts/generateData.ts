import { ThingData } from "../models";
const dotenv = require("dotenv");
dotenv.config();

const { cassandraClient } = require("../config/cassandra");
const { TimeUuid } = require("cassandra-driver").types;

/**
 * Configuración del proceso de inserción
 */
const NUM_RECORDS: number = 5_000_000;  // 📌 5M de registros
const BATCH_SIZE: number = 500;  // 📌 Se reduce el batch para evitar sobrecarga
const MAX_RETRIES: number = 3;  // 📌 Reintentos en caso de fallo masivo
const CONCURRENT_BATCHES: number = 5;  // 📌 Evitar sobrecarga de memoria

/**
 * Genera un identificador `thing_id` válido (TEXT)
 */
function getRandomThingId (): string {
  return `thing_${ Math.floor(Math.random() * 99999) }`;
}

/**
 * Genera una clave `key` válida (TEXT)
 */
function getRandomKey (): string {
  return `sensor_${ Math.floor(Math.random() * 100) }`;
}

/**
 * Genera un `app_id` válido (ASCII)
 */
function getRandomAppId (): string {
  return `app${ Math.floor(Math.random() * 10) }`;
}

/**
 * Genera una ubicación geográfica aleatoria (`BLOB`)
 */
function getRandomGeo (): Buffer {
  return Buffer.from(JSON.stringify({ lat: 40.7128, lon: -74.0060 }));
}

/**
 * Genera un valor `BLOB` de tamaño seguro
 */
function getRandomBlob (size = 16): Buffer {
  return Buffer.alloc(size, Math.floor(Math.random() * 256));
}

/**
 * Genera una dirección IP válida (`INET`)
 */
function getRandomIp (): string {
  return `${ Math.floor(Math.random() * 256) }.${ Math.floor(Math.random() * 256) }.${ Math.floor(Math.random() * 256) }.${ Math.floor(Math.random() * 256) }`;
}

/**
 * Inserta un batch en Cassandra con reintentos en caso de error
 */
async function insertBatch (records: ThingData[], attempt = 1): Promise<void> {
  const query = `
    INSERT INTO the_shire.thing_data (thing_id, key, date_time, app_id, created_at, geo, ip, iv, model_id, value) 
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
 * Estima la cantidad de registros insertados usando paginación eficiente
 */
async function estimateRecordCount (): Promise<number> {
  let total = 0;
  let pagingState = null;
  const pageSize = 5000; // 🔹 Se reduce la carga en la consulta

  do {
    const result: any = await cassandraClient.execute(
      "SELECT thing_id FROM the_shire.thing_data;",
      [],
      { fetchSize: pageSize, pagingState }
    );

    total += result.rowLength;
    pagingState = result.pagingState;

  } while (pagingState);

  console.log(`🔹 Estimación de registros insertados: ${ total.toLocaleString() }`);
  return total;
}
async function countAllRecords() {
  let totalRecords = 0;
  let pagingState = null;
  const pageSize = 50000; // 🔹 Consultar en lotes de 50,000

  do {
      const result:any = await cassandraClient.execute(
          "SELECT thing_id FROM the_shire.thing_data;",
          [],
          { fetchSize: pageSize, pagingState }
      );

      totalRecords += result.rowLength;
      pagingState = result.pagingState; // 🔄 Guarda el estado de paginación

      console.log(`📊 Registros contados hasta ahora: ${totalRecords.toLocaleString()}`);

  } while (pagingState); // 🔄 Sigue hasta que no haya más registros

  console.log(`✅ Total de registros en Cassandra: ${totalRecords.toLocaleString()}`);
}
/**
 * Genera los datos y los inserta en Cassandra usando lotes concurrentes
 */
async function generateData () {
  console.log("🚀 Verificando registros existentes...");

  await countAllRecords();

  const insertedRecords = await estimateRecordCount();
  console.log(`📌 Registros ya insertados: ${ insertedRecords.toLocaleString() }`);

  if (insertedRecords >= NUM_RECORDS) {
    console.log("✅ Ya se insertaron todos los registros. No es necesario continuar.");
    process.exit(0);
  }

  console.log(`🔄 Continuando la inserción desde ${ insertedRecords.toLocaleString() } hasta ${ NUM_RECORDS.toLocaleString() }...`);

  let totalInserted = insertedRecords;
  const startTime = Date.now(); // ⏱ Inicia el temporizador

  while (totalInserted < NUM_RECORDS) {
    const batches = [];
    const batchStartTime = Date.now(); // ⏱ Tiempo por lote

    for (let i = 0; i < CONCURRENT_BATCHES && totalInserted < NUM_RECORDS; i++) {
      const batch: ThingData[] = [];

      for (let j = 0; j < BATCH_SIZE && totalInserted < NUM_RECORDS; j++) {
        batch.push({
          thing_id: getRandomThingId(), // ✅ `TEXT` seguro
          key: getRandomKey(), // ✅ `TEXT` seguro
          date_time: TimeUuid.now(),
          app_id: getRandomAppId(), // ✅ `ASCII` seguro
          created_at: new Date(),
          geo: getRandomGeo(), // ✅ `BLOB` seguro
          ip: getRandomIp(), // ✅ `INET` válido
          iv: getRandomBlob(16), // ✅ `BLOB` seguro
          model_id: Math.floor(Math.random() * 1000000), // ✅ `INT` seguro
          value: getRandomBlob(16), // ✅ `BLOB` seguro
        });
        totalInserted++;
      }
      batches.push(insertBatch(batch));
    }

    try {
      await Promise.all(batches);
      const batchEndTime = Date.now();
      const batchDuration = ((batchEndTime - batchStartTime) / 1000).toFixed(2); // ⏱ Tiempo por lote
      console.log(`✅ Insertados ${totalInserted.toLocaleString()} registros... ⏱ Duración del lote: ${batchDuration}s`);
    } catch (error) {
      console.error("❌ Error en la inserción de lotes:", error);
      process.exit(1);
    }
  }

  const endTime = Date.now(); // ⏱ Fin del temporizador
  const totalTime = ((endTime - startTime) / 1000).toFixed(2); // ⏱ Tiempo total en segundos
  const avgTimePerBatch = (parseFloat(totalTime) / (NUM_RECORDS / BATCH_SIZE)).toFixed(2); // ⏱ Promedio por lote
  const recordsPerSecond = (NUM_RECORDS / parseFloat(totalTime)).toFixed(2); // 🔥 Registros por segundo

  console.log("🎉 Todos los datos han sido insertados correctamente en Cassandra.");
  console.log(`⏱ Tiempo total de ejecución: ${ totalTime }s`);
  console.log(`⚡ Promedio por lote: ${ avgTimePerBatch }s`);
  console.log(`📊 Registros por segundo: ${ recordsPerSecond } registros/s`);

  process.exit(0);
}

generateData();
