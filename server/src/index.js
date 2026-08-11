import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';

import { execSync } from 'child_process';

dotenv.config();

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

// Automatically ensure database schema & tables exist on boot
try {
  console.log('📦 Auto-syncing database schema with Prisma...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  console.log('✅ Database schema ready!');
} catch (dbErr) {
  console.warn('⚠️ Auto DB push notice:', dbErr.message);
}

const app = express();
const PORT = process.env.PORT || 5000;

// CORS setup to allow Vercel and all frontend origins
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Root Landing Route
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: system-ui, sans-serif; background: #0b0f19; color: #fff; padding: 40px; text-align: center; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <h1 style="color: #6366f1; margin-bottom: 8px;">🤖 Scribe-AI Backend API is Live!</h1>
      <p style="color: #94a3b8; max-width: 500px;">Your Node.js + Express API server is active and running cleanly on Render.</p>
      <a href="/api/health" style="margin-top: 16px; background: #4f46e5; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">Check API Health Status</a>
    </div>
  `);
});

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'AI Smart Email Sender Backend API',
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
  console.log(`🤖 AI Smart Email Sender Server active on port ${PORT}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log(`====================================================`);
});
