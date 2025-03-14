import { MongoClient, Db, Collection } from "mongodb";
import { env } from "./env";

/** MongoDB client instance */
let mongoClient: MongoClient | null = null;

/** MongoDB database instance */
let mongoDb: Db | null = null;

/** MongoDB collection instance */
let mongoCollection: Collection | null = null;

/**
 * Connects to MongoDB and initializes the database and collection.
 * @returns {Promise<void>}
 */
export async function connectMongo(): Promise<void> {      
    if (mongoClient && mongoDb && mongoCollection) {
        return;
    }

    try {
        console.log("🔄 Conectando a MongoDB...");
        mongoClient = new MongoClient(env.mongo.uri);
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

/**
 * Closes the MongoDB connection gracefully.
 * @returns {Promise<void>}
 */
export async function closeMongoConnection(): Promise<void> {
    if (mongoClient) {
        await mongoClient.close();
        console.log("🔌 Conexión a MongoDB cerrada.");
        mongoClient = null;
        mongoDb = null;
        mongoCollection = null;
    }
}