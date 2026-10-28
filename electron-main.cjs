// ==============================================================================
// GOM COLOR PICKER PRO — ELECTRON MAIN PROCESS (STANDALONE DESKTOP APPLICATION)
// ==============================================================================

const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();
let mainWindow = null;

if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

// MIME types for embedded local server
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
  '.webp': 'image/webp',
  '.zip': 'application/zip',
  '.txt': 'text/plain; charset=utf-8'
};

// Start in-process loopback HTTP server
function startEmbeddedServer() {
  return new Promise((resolve, reject) => {
    const rootDir = __dirname;

    const server = http.createServer((req, res) => {
      let reqUrl = req.url.split('?')[0];
      if (reqUrl === '/') reqUrl = '/index.html';

      // Security: prevent path traversal outside rootDir
      const safePath = path.normalize(decodeURIComponent(reqUrl)).replace(/^(\.\.[\/\\])+/, '');
      const filePath = path.join(rootDir, safePath);

      fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Length': stats.size,
          'Cache-Control': 'no-cache'
        });

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
      });
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      console.log(`[GOM Electron] Servidor local interno activo en http://127.0.0.1:${port}`);
      resolve({ server, port });
    });

    server.on('error', reject);
  });
}

async function createWindow() {
  const { port } = await startEmbeddedServer();

  const iconPath = path.join(__dirname, 'installer', 'app_icon.ico');

  mainWindow = new BrowserWindow({
    width: 1600,
    height: 960,
    minWidth: 1200,
    minHeight: 760,
    title: 'GOM Color Picker Pro — Estudio de Color y Arte Digital',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    backgroundColor: '#0d1117',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  // Remove standard browser menu bar
  Menu.setApplicationMenu(null);

  // Open external links (if any) in the system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(`http://127.0.0.1:${port}`)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Load the application from the in-process server
  mainWindow.loadURL(`http://127.0.0.1:${port}/index.html`);
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
