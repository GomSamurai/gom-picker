/**
 * GOM Picker - Lightweight Zero-Dependency Local HTTP Server
 * Serves static files with correct MIME types for ES Modules and Photoshop UXP.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Usamos el puerto 5050 para evitar colisiones con Service Workers
// o proyectos previos del usuario en el puerto 3000 (ej: Soundscape Studio)
const INITIAL_PORT = 5050;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.mjs': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml; charset=UTF-8',
  '.ico': 'image/x-icon',
  '.ase': 'application/octet-stream',
  '.gpl': 'text/plain; charset=UTF-8',
  '.txt': 'text/plain; charset=UTF-8'
};

function startServer(port) {
  const clients = new Set();

  // Watcher para Live-Reload automático en cambios de disco
  const watchDirs = [ROOT_DIR, path.join(ROOT_DIR, 'scripts'), path.join(ROOT_DIR, 'styles')];
  let reloadDebounce = null;
  const notifyClients = () => {
    clearTimeout(reloadDebounce);
    reloadDebounce = setTimeout(() => {
      console.log('[LiveReload] Cambio detectado en archivos -> notificando al navegador...');
      for (const client of clients) {
        try {
          client.write('data: reload\n\n');
        } catch (e) {
          clients.delete(client);
        }
      }
    }, 120);
  };

  watchDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      try {
        fs.watch(dir, { recursive: false }, (evt, filename) => {
          if (filename && (filename.endsWith('.js') || filename.endsWith('.css') || filename.endsWith('.html'))) {
            notifyClients();
          }
        });
      } catch (e) {}
    }
  });

  const server = http.createServer((req, res) => {
    // Cabeceras CORS completas para Photoshop UXP / CEP
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    let reqUrl = req.url.split('?')[0];

    // Endpoint de Live-Reload (SSE)
    if (reqUrl === '/livereload-stream') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });
      res.write(': connected\n\n');
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }

    if (reqUrl === '/' || reqUrl === '') {
      reqUrl = '/index.html';
    }

    const safePath = path.normalize(decodeURIComponent(reqUrl)).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(ROOT_DIR, safePath);

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('404 Not Found: ' + reqUrl);
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Content-Length': stats.size
      });

      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[!] Puerto ${port} en uso, probando con ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('[Error de servidor]:', err);
    }
  });

  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log('\n======================================================');
    console.log('   🎨 GOM COLOR PICKER PRO — SERVIDOR LOCAL ACTIVO    ');
    console.log('======================================================');
    console.log(`\n  ▶ URL Local:         ${url}`);
    console.log(`  ▶ Directorio Raíz:   ${ROOT_DIR}`);
    console.log(`  ▶ Compatibilidad:    Navegador Web + Photoshop UXP`);
    console.log(`  ▶ Puerto Limpio:     ${port} (libre de conflictos de cache)\n`);
    console.log('  Pulsa [Ctrl + C] en cualquier momento para detener.\n');
    console.log('------------------------------------------------------\n');

    // Abre automáticamente el navegador predeterminado en Windows
    exec(`start "" "${url}"`, (openErr) => {
      if (openErr) {
        console.log(`[i] Abre manualmente tu navegador en: ${url}`);
      }
    });
  });
}

startServer(INITIAL_PORT);
