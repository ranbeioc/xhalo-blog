import http from 'node:http';
import worker from '../workers/api/src/index.js';

const port = 18787;
const env = {
  ADMIN_API_SHARED_SECRET: 'test-admin-secret',
  LIVE_WRITES_ENABLED: 'false',
  GITHUB_OWNER: 'ranbeioc',
  GITHUB_REPO: 'hexo-blog',
  GITHUB_BRANCH: 'main'
};

const server = http.createServer(async (req, res) => {
  // Read body
  const buffers = [];
  for await (const chunk of req) {
    buffers.push(chunk);
  }
  const body = Buffer.concat(buffers);

  // Construct headers
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      if (Array.isArray(value)) {
        value.forEach(v => headers.append(key, v));
      } else {
        headers.set(key, value);
      }
    }
  }

  const method = req.method;
  const url = `http://localhost:${port}${req.url}`;
  
  const workerRequest = new Request(url, {
    method,
    headers,
    body: method === 'GET' || method === 'HEAD' ? null : body
  });

  try {
    const workerResponse = await worker.fetch(workerRequest, env);
    
    // Copy headers
    res.statusCode = workerResponse.status;
    workerResponse.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const responseBody = await workerResponse.arrayBuffer();
    res.end(Buffer.from(responseBody));
  } catch (err) {
    console.error('Worker error:', err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(port, () => {
  console.log(`Local Node.js bridge server listening on http://localhost:${port}`);
});
