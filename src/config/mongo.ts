// @ts-ignore
import { MongoClient, Db, Collection } from "mongodb";
import { env } from "./env";

// Instancia del cliente de MongoDB
const mongoClient = new MongoClient(env.mongo.uri);

// Variables para la base de datos y colección
let mongoDb: Db;
let mongoCollection: Collection;

/**
 * Conecta con MongoDB y asigna la base de datos y colección
 */
export async function connectMongo() {
  if (!mongoClient.isConnected()) {
    try {
      console.log("🔄 Conectando a MongoDB...");
      await mongoClient.connect();
      mongoDb = mongoClient.db(env.mongo.dbName);
      mongoCollection = mongoDb.collection(env.mongo.collection);
      console.log("✅ Conectado a MongoDB");
    } catch (error) {
      console.error("❌ Error al conectar con MongoDB", error);
    }
  }
}

/**
 * Obtiene la conexión a la base de datos
 */
export function getMongoDb(): Db {
  if (!mongoDb) {
    throw new Error("❌ No hay conexión a MongoDB. Llama a connectMongo() primero.");
  }
  return mongoDb;
}

/**
 * Obtiene la colección
 */
export function getMongoCollection(): Collection {
  if (!mongoCollection) {
    throw new Error("❌ No hay conexión a MongoDB. Llama a connectMongo() primero.");
  }
  return mongoCollection;
}
