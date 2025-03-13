export interface ThingData {
  thing_id: string; // ✅ text
  key: string; // ✅ text
  date_time: any; // ✅ timeuuid (se representará con `types.TimeUuid` en Cassandra)
  app_id: string; // ✅ ascii
  created_at: Date; // ✅ timestamp (Cassandra almacena timestamps como Date)
  geo: Buffer; // ✅ blob (ahora se almacena correctamente como Buffer)
  ip: string; // ✅ inet (mantener como string, Cassandra lo interpreta)
  iv: Buffer; // ✅ blob (ahora se almacena correctamente como Buffer)
  model_id: number; // ✅ int
  value: Buffer; // ✅ blob (ahora se almacena correctamente como Buffer)
}
