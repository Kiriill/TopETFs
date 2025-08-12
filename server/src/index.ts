import express, { Request, Response } from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { fetchLatestETFData, fetchHistoricalETFData } from './services/etfService';
import { createServer } from 'http';
import { AddressInfo } from 'net';

const app = express();
const preferredPorts = [3001, 3005, 3006, 3007, 3008, 3009];

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// API endpoint to get ETF data
app.get('/api/etfs', async (req: Request, res: Response) => {
  try {
    console.log('Received request for ETF data');
    const result = await fetchLatestETFData();
    console.log(`Successfully fetched ${result.etfs.length} ETFs from ${result.dataDate.monthName} ${result.dataDate.year}`);
    res.json({ etfs: result.etfs, dataDate: result.dataDate });
  } catch (error) {
    console.error('Error serving ETF data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch ETF data',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// API endpoint to get historical ETF data
app.get('/api/etfs/historical', async (req: Request, res: Response) => {
  try {
    const startYear = parseInt(req.query.startYear as string) || 2017;
    const endYear = parseInt(req.query.endYear as string) || new Date().getFullYear();
    
    console.log(`Historical data request: ${startYear} to ${endYear}`);
    const result = await fetchHistoricalETFData(startYear, endYear);
    res.json({ 
      etfs: result.etfs, 
      dataDate: result.dataDate,
      totalRecords: result.etfs.length,
      dateRange: { startYear, endYear }
    });
  } catch (error) {
    console.error('Error fetching historical ETF data:', error);
    res.status(500).json({ error: 'Failed to fetch historical ETF data' });
  }
});

// Function to try starting the server on different ports
async function startServer(): Promise<void> {
  for (const port of preferredPorts) {
    try {
      const server = createServer(app);
      
      await new Promise<void>((resolve, reject) => {
        server.on('error', (error: any) => {
          if (error.code === 'EADDRINUSE') {
            console.log(`Port ${port} is in use, trying next port...`);
            server.close();
            resolve();
          } else {
            reject(error);
          }
        });

        server.listen(port, () => {
          const address = server.address() as AddressInfo;
          console.log(`Server running on port ${address.port}`);
          resolve();
        });
      });

      // If we get here, the server started successfully
      return;
    } catch (error) {
      console.error(`Failed to start server on port ${port}:`, error);
      // Continue to next port
    }
  }

  // If we get here, all ports failed
  throw new Error('Failed to start server on any available port');
}

// Schedule ETF data updates every day at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    await fetchLatestETFData();
    console.log('Successfully updated ETF data');
  } catch (error) {
    console.error('Failed to update ETF data:', error);
  }
});

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
}); 