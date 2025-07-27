const express = require('express');
const next = require('next');
const path = require('path');

const port = process.env.PORT || 3000;
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  // Serve static files explicitly
  server.use('/_next/static', express.static(path.join(__dirname, '.next/static')));
  server.use(express.static(path.join(__dirname, 'public')));

  server.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});