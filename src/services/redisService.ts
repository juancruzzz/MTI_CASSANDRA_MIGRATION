const redis = require("redis");
const client = redis.createClient({ host: "ttio-redis", port: 6379 });

client.on("error", (err) => console.error("❌ Redis Error:", err));

async function cacheFailedBatch(batchId, data) {
    await client.set(`failed_batch_${batchId}`, JSON.stringify(data));
}

async function getFailedBatches() {
    return new Promise((resolve) => {
        client.keys("failed_batch_*", async (err, keys) => {
            if (err) return resolve([]);
            const failedData = await Promise.all(keys.map((key) => client.get(key)));
            resolve(failedData.map((d) => JSON.parse(d)));
        });
    });
}

module.exports = { cacheFailedBatch, getFailedBatches };
