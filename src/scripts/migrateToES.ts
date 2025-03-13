import { migrateData } from "../services/migrationService";

(async () => {
    try {
        console.log("🚀 Ejecutando script de migración...");
        await migrateData();
        console.log("✅ Migración finalizada con éxito.");
    } catch (error) {
        console.error("❌ Error crítico en la migración", error);
        process.exit(1);
    }
})();
