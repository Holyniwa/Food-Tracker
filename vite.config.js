import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const localDataServer = () => ({
  name: 'local-data-server',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url === '/api/data' && req.method === 'GET') {
        const filePath = path.resolve(process.cwd(), 'data.json');
        if (fs.existsSync(filePath)) {
          res.setHeader('Content-Type', 'application/json');
          res.end(fs.readFileSync(filePath));
        } else {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(null));
        }
        return;
      }
      if (req.url === '/api/data' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          const filePath = path.resolve(process.cwd(), 'data.json');
          fs.writeFileSync(filePath, body);
          res.statusCode = 200;
          res.end('Saved');
        });
        return;
      }
      next();
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localDataServer()],
  server: {
    port: 5188,
    strictPort: true,
    open: true
  }
})
