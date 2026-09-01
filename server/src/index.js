/**
 * ============================================================================
 * Scribe-AI — Express Backend Server (index.js)
 * ============================================================================
 * Node.js + Express API server entry point:
 * - Supabase PostgreSQL persistent database connectivity via Prisma ORM
 * - CORS middleware with credential support
 * - Static uploads serving
 * - REST API routing mounted under /api
 * - Global error handling & health checks
 */

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';
import { prisma } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup to allow Vercel and all authorized frontend origins
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Root Landing Route
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: system-ui, sans-serif; background: #0b0f19; color: #fff; padding: 40px; text-align: center; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <h1 style="color: #6366f1; margin-bottom: 8px;">🤖 Scribe AI Backend API is Live!</h1>
      <p style="color: #94a3b8; max-width: 500px;">Your Node.js + Express API server is active and connected to Supabase PostgreSQL.</p>
      <a href="/api/health" style="margin-top: 16px; background: #4f46e5; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">Check API Health Status</a>
    </div>
  `);
});

// Healthcheck with live Supabase database connectivity test
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected (Supabase PostgreSQL)';
  } catch (e) {
    dbStatus = 'error: ' + (e.message || 'Database connection error');
  }

  res.json({
    status: 'online',
    database: dbStatus,
    service: 'Scribe AI Backend API',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', apiRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Exception:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🤖 Scribe AI Server active on port ${PORT}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log(`📦 Database: Supabase PostgreSQL via Prisma`);
  console.log(`====================================================`);
});
