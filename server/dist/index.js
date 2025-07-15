"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const node_cron_1 = __importDefault(require("node-cron"));
const etfService_1 = require("./services/etfService");
const http_1 = require("http");
const app = (0, express_1.default)();
const preferredPorts = [3001, 3005, 3006, 3007, 3008, 3009];
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
// API endpoint to get ETF data
app.get('/api/etfs', async (req, res) => {
    try {
        console.log('Received request for ETF data');
        const data = await (0, etfService_1.fetchLatestETFData)();
        console.log(`Successfully fetched ${data.length} ETFs`);
        res.json(data);
    }
    catch (error) {
        console.error('Error serving ETF data:', error);
        res.status(500).json({
            error: 'Failed to fetch ETF data',
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
// Function to try starting the server on different ports
async function startServer() {
    for (const port of preferredPorts) {
        try {
            const server = (0, http_1.createServer)(app);
            await new Promise((resolve, reject) => {
                server.on('error', (error) => {
                    if (error.code === 'EADDRINUSE') {
                        console.log(`Port ${port} is in use, trying next port...`);
                        server.close();
                        resolve();
                    }
                    else {
                        reject(error);
                    }
                });
                server.listen(port, () => {
                    const address = server.address();
                    console.log(`Server running on port ${address.port}`);
                    resolve();
                });
            });
            // If we get here, the server started successfully
            return;
        }
        catch (error) {
            console.error(`Failed to start server on port ${port}:`, error);
            // Continue to next port
        }
    }
    // If we get here, all ports failed
    throw new Error('Failed to start server on any available port');
}
// Schedule ETF data updates every day at midnight
node_cron_1.default.schedule('0 0 * * *', async () => {
    try {
        await (0, etfService_1.fetchLatestETFData)();
        console.log('Successfully updated ETF data');
    }
    catch (error) {
        console.error('Failed to update ETF data:', error);
    }
});
// Start the server
startServer().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
