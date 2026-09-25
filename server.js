/**
 * Scribe-AI — Full-Stack Server
 * Single Node.js/Express process serving API endpoints and mounting Vite dev middlewares on port 3000.
 */

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import apiRouter from './server/src/routes/api.js';
import { prisma } from './server/src/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

// CORS setup
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Healthcheck endpoint
app.get('/api/health', async (req, res) => {
  let dbStatus = 'active (in-memory)';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (e) {
    dbStatus = 'active (fallback)';
  }

  res.json({
    status: 'online',
    database: dbStatus,
    service: 'Scribe AI Backend API',
    timestamp: new Date().toISOString()
  });
});

// Mount Centralized REST API Routes under /api
app.use('/api', apiRouter);

// Frontend integration: Vite middleware in development, static build in production
const isProduction = process.env.NODE_ENV === 'production';
const distDir = path.resolve(__dirname, 'client/dist');

if (!isProduction) {
  // Development mode: mount Vite dev server as middleware for instant HMR
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true, host: '0.0.0.0' },
    appType: 'spa',
    root: path.resolve(__dirname, 'client'),
  });
  app.use(vite.middlewares);
} else {
  // Production mode: serve compiled client assets
  app.use(express.static(distDir));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(distDir, 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Exception:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, HOST, () => {
  console.log(`====================================================`);
  console.log(`🤖 Scribe-AI running at http://${HOST}:${PORT}`);
  console.log(`====================================================`);
});

export default app;
