import { MongoClient } from "mongodb";
import { env } from "./env";

export const mongoClient = new MongoClient(env.mongo.uri);
export const mongoDb = mongoClient.db(env.mongo.dbName);
export const logsCollection = mongoDb.collection(env.mongo.collection);
