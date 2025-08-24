// Script de inicio robusto para Railway
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const port = process.env.PORT || 3000;

// Debug info al inicio
console.log('=== RAILWAY STARTUP DEBUG ===');
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);
console.log('Current directory:', process.cwd());
console.log('Environment variables:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('- MP_PUBLIC_KEY:', process.env.MP_PUBLIC_KEY ? 'SET' : 'NOT SET');
console.log('- MP_ACCESS_TOKEN:', process.env.MP_ACCESS_TOKEN ? 'SET' : 'NOT SET');

// Middleware básico
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint (crítico para Railway)
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.0',
    message: 'Magno Terra API is running',
    port: port
  });
});

// Root endpoint
app.get('/', (req, res) => {
  console.log('Root endpoint requested');
  res.json({
    name: 'Magno Terra API',
    version: '1.0.0',
    status: 'running',
    health: '/health',
    environment: process.env.NODE_ENV || 'production'
  });
});

// API info endpoint
app.get('/api', (req, res) => {
  console.log('API info requested');
  res.json({
    name: 'Magno Terra API',
    version: '1.0.0',
    description: 'E-commerce API for Magno Terra',
    endpoints: {
      health: '/health',
      root: '/',
      api: '/api'
    }
  });
});

// Error handling básico
app.use((err, req, res, next) => {
  console.error('Error occurred:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('404 for path:', req.originalUrl);
  res.status(404).json({ 
    error: 'Not Found',
    path: req.originalUrl,
    available: ['/', '/health', '/api']
  });
});

// Iniciar servidor
const server = app.listen(port, '0.0.0.0', () => {
  console.log('=== RAILWAY STARTUP SUCCESS ===');
  console.log(`🚀 Magno Terra API running on port ${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
  console.log(`🔗 Base URL: http://localhost:${port}/`);
  console.log(`🔗 API info: http://localhost:${port}/api`);
  console.log('=== READY FOR REQUESTS ===');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
