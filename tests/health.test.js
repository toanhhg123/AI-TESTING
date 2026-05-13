const assert = require('node:assert/strict');
const http = require('node:http');
const test = require('node:test');

const app = require('../src/app');

function request(server, path) {
  const { port } = server.address();

  return new Promise((resolve, reject) => {
    const req = http.get(
      {
        hostname: '127.0.0.1',
        port,
        path,
      },
      (res) => {
        let body = '';

        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            body: JSON.parse(body),
          });
        });
      }
    );

    req.on('error', reject);
  });
}

test('GET /api/health returns service status', async () => {
  const server = app.listen(0);

  try {
    const response = await request(server, '/api/health');

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.status, 'ok');
    assert.equal(response.body.service, 'mobile-commerce-api');
    assert.ok(response.body.timestamp);
  } finally {
    server.close();
  }
});
