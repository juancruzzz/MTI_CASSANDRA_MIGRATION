import os from "os";
import chalk from "chalk";

/**
 * Retrieves the CPU usage as a percentage.
 * @returns {Promise<number>} CPU usage percentage.
 */
function getCpuLoad(): Promise<number> {
    return new Promise((resolve) => {
        const startTime = process.hrtime();
        const startUsage = process.cpuUsage();

        setTimeout(() => {
            const elapsedTime = process.hrtime(startTime);
            const elapsedUsage = process.cpuUsage(startUsage);

            const elapsedTimeMs = (elapsedTime[0] * 1000) + (elapsedTime[1] / 1e6);
            const cpuPercent = ((elapsedUsage.user + elapsedUsage.system) / 1000) / elapsedTimeMs * 100;

            resolve(parseFloat(cpuPercent.toFixed(2)));
        }, 500); // Captura en 500ms
    });
}

/**
 * Logs system CPU and RAM usage at intervals.
 */
async function monitorSystemUsage() {
    console.log(chalk.yellow("🔍 Iniciando monitoreo del sistema... Presiona CTRL + C para detener."));

    setInterval(async () => {
        const cpuUsage = await getCpuLoad();
        const totalMemMB = (os.totalmem() / 1024 / 1024).toFixed(2);
        const freeMemMB = (os.freemem() / 1024 / 1024).toFixed(2);
        const usedMemMB = (parseFloat(totalMemMB) - parseFloat(freeMemMB)).toFixed(2);
        const memUsagePercent = ((parseFloat(usedMemMB) / parseFloat(totalMemMB)) * 100).toFixed(2);

        console.log(
            chalk.blue(
                `💻 CPU: ${cpuUsage.toFixed(2)}% | RAM: ${usedMemMB}MB / ${totalMemMB}MB (${memUsagePercent}%)`
            )
        );
    }, 3000); // 🔄 Ejecuta cada 3 segundos
}

monitorSystemUsage();
