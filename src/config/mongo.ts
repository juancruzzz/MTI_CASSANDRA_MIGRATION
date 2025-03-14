import { MongoClient, Db, Collection } from "mongodb";
import { env } from "./env";

/** MongoDB client instance */
const mongoClient = new MongoClient(env.mongo.uri);

/** MongoDB database instance */
let mongoDb: Db;

/** MongoDB collection instance */
let mongoCollection: Collection;

/**
 * Connects to MongoDB and initializes the database and collection.
 * @returns {Promise<void>}
 */
export async function connectMongo(): Promise<void> {
    try {
        console.log("🔄 Conectando a MongoDB...");
        await mongoClient.connect();
        mongoDb = mongoClient.db(env.mongo.dbName);
        mongoCollection = mongoDb.collection(env.mongo.collection);
        console.log("✅ Conectado a MongoDB");
    } catch (error) {
        console.error("❌ Error al conectar con MongoDB:", error);
    }
}

/**
 * Retrieves the MongoDB database instance.
 * @returns {Db} The MongoDB database instance.
 * @throws {Error} If the database connection has not been established.
 */
export function getMongoDb(): Db {
    if (!mongoDb) {
        throw new Error("❌ No hay conexión a MongoDB. Llama a connectMongo() primero.");
    }
    return mongoDb;
}

/**
 * Retrieves the MongoDB collection instance.
 * @returns {Collection} The MongoDB collection instance.
 * @throws {Error} If the collection connection has not been established.
 */
export function getMongoCollection(): Collection {
    if (!mongoCollection) {
        throw new Error("❌ No hay conexión a MongoDB. Llama a connectMongo() primero.");
    }
    return mongoCollection;
}
