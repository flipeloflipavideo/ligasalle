// Production startup script for Render deployment
const { createServer } = require('http');
const { Server } = require('socket.io');
const next = require('next');
const { setupSocket } = require('./src/lib/socket');

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;
const hostname = '0.0.0.0';

async function startServer() {
  try {
    console.log('🚀 Starting Ligasalle production server...');
    
    // Create Next.js app
    const app = next({ 
      dev,
      dir: process.cwd(),
      conf: {
        distDir: '.next',
        // Production optimizations
        compress: true,
        poweredByHeader: false
      }
    });

    await app.prepare();
    const handle = app.getRequestHandler();

    // Create HTTP server
    const server = createServer(async (req, res) => {
      // Handle socket.io requests separately
      if (req.url?.startsWith('/api/socketio')) {
        return;
      }
      
      // Add security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      
      handle(req, res);
    });

    // Setup Socket.IO for production
    const io = new Server(server, {
      path: '/api/socketio',
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || "*",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    setupSocket(io);

    // Start listening
    server.listen(port, hostname, () => {
      console.log(`✅ Ligasalle server ready on http://${hostname}:${port}`);
      console.log(`🔌 Socket.IO server running at ws://${hostname}:${port}/api/socketio`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`📊 Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🔄 Received SIGTERM, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
}

startServer();