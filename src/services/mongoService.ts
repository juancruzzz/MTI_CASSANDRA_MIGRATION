import { getMongoCollection } from "../config/mongo";

/**
 * 📌 Guarda errores en MongoDB
 */
export async function logError(error: any, batch: any) {
  await getMongoCollection().insertOne({ error, batch, timestamp: new Date() });
}
