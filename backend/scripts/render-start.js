// backend/scripts/render-start.js — [Backend]
// {/* Render Start Script - Runs migrations then starts server */}
import { execSync } from 'child_process';
import { spawn } from 'child_process';

async function startRenderServer() {
  console.log('🚀 Starting CS2 Skin Tracker Backend on Render...');
  
  try {
    // Step 1: Run deployment script (migrations)
    console.log('📦 Running deployment process...');
    execSync('node scripts/render-deploy.js', { stdio: 'inherit' });
    
    // Step 2: Start the server
    console.log('🌐 Starting Express server...');
    const server = spawn('node', ['src/server.js'], {
      stdio: 'inherit',
      env: process.env
    });
    
    // Handle server process
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      process.exit(1);
    });
    
    server.on('exit', (code) => {
      console.log(`🔄 Server exited with code ${code}`);
      process.exit(code);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 Received SIGTERM, shutting down gracefully...');
      server.kill('SIGTERM');
    });
    
    process.on('SIGINT', () => {
      console.log('🛑 Received SIGINT, shutting down gracefully...');
      server.kill('SIGINT');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startRenderServer();
}

export default startRenderServer;
