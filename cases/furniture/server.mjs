import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { rooms, categories } = require('./catalog.js');
const { filter, quote, fit } = require('./engine.js');
const root = new URL('../../', import.meta.url);
const prefix = '/cases/furniture/';
const bodyLimit = 16 * 1024;
const contentTypes = new Map([
  ['html', 'text/html; charset=utf-8'],
  ['js', 'text/javascript; charset=utf-8'],
  ['css', 'text/css; charset=utf-8'],
  ['svg', 'image/svg+xml'],
  ['jpg', 'image/jpeg'],
  ['webp', 'image/webp']
]);
const caseFiles = new Set(['index.html', 'styles.css', 'app.js', 'catalog.js', 'engine.js']);
const publicStudioFile = /^\/(?:[a-z-]+\.(?:html|js|css)|(?:assets|cases\/forma(?:\/assets)?)\/[a-z0-9-]+\.(?:html|js|css|svg|jpg|webp))$/;
const apiRoutes = new Map([
  ['catalog', { method: 'GET', run: (url) => ({ rooms, categories, products: filter(queryFilters(url)) }) }],
  ['quote', { method: 'POST', run: async (_, request) => quote((await readJson(request)).items) }],
  ['fit', { method: 'POST', run: async (_, request) => fit(await readJson(request)) }]
]);

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function queryFilters(url) {
  const params = Object.fromEntries(url.searchParams);
  for (const name of ['width', 'depth', 'price']) {
    if (params[name] !== undefined) params[name] = Number(params[name]);
  }
  return params;
}

async function readJson(request) {
  const type = request.headers['content-type']?.split(';')[0].trim().toLowerCase();
  if (type !== 'application/json') {
    request.resume();
    throw new RequestError(415, 'Ожидается application/json.');
  }

  if (Number(request.headers['content-length']) > bodyLimit) {
    request.resume();
    throw new RequestError(413, 'Запрос слишком большой.');
  }

  const chunks = [];
  let size = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > bodyLimit) {
      request.resume();
      throw new RequestError(413, 'Запрос слишком большой.');
    }
    chunks.push(chunk);
  }

  let data;
  try {
    data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new RequestError(400, 'Некорректный JSON.');
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new RequestError(400, 'Ожидается объект JSON.');
  }
  return data;
}

function sendJson(response, status, data, headers = {}) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  response.end(JSON.stringify(data));
}

async function handler(request, response) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  const url = new URL(request.url, 'http://localhost');
  const { pathname } = url;
  if (pathname.startsWith(prefix + 'api/')) {
    const route = apiRoutes.get(pathname.slice((prefix + 'api/').length));
    if (!route) return sendJson(response, 404, { error: 'Метод API не найден.' });
    if (request.method !== route.method) {
      request.resume();
      return sendJson(response, 405, { error: 'HTTP-метод не поддерживается.' }, { Allow: route.method });
    }
    return sendJson(response, 200, await route.run(url, request));
  }

  if (!['GET', 'HEAD'].includes(request.method)) {
    request.resume();
    return sendJson(response, 405, { error: 'HTTP-метод не поддерживается.' }, { Allow: 'GET, HEAD' });
  }

  if (pathname === '/' || pathname === prefix.slice(0, -1)) {
    response.writeHead(302, { Location: prefix });
    return response.end();
  }

  const file = pathname === prefix ? prefix + 'index.html' : pathname;
  const caseFile = file.slice(prefix.length);
  const isFurniture = file.startsWith(prefix) &&
    (caseFiles.has(caseFile) || /^assets\/[a-z0-9-]+\.webp$/.test(caseFile));
  if (!isFurniture && !publicStudioFile.test(file)) {
    throw new RequestError(404, 'Страница не найдена.');
  }

  let content = await readFile(new URL('.' + file, root));
  if (file === prefix + 'index.html') {
    content = content.toString('utf8').replace('<html lang="ru">', '<html lang="ru" data-furniture-api>');
  }
  response.writeHead(200, { 'Content-Type': contentTypes.get(file.split('.').at(-1)) });
  response.end(request.method === 'HEAD' ? undefined : content);
}

const server = createServer({ requestTimeout: 15000 }, (request, response) => {
  handler(request, response).catch((error) => {
    if (response.destroyed) return;
    if (error instanceof RequestError) return sendJson(response, error.status, { error: error.message });
    if (error instanceof RangeError) return sendJson(response, 400, { error: error.message });
    if (error.code === 'ENOENT') return sendJson(response, 404, { error: 'Страница не найдена.' });
    console.error(error);
    return sendJson(response, 500, { error: 'Внутренняя ошибка сервера.' });
  });
});

const port = Number(process.env.PORT ?? 8080);
server.listen(port, '127.0.0.1', () => {
  console.log('Мера · http://127.0.0.1:' + server.address().port + prefix);
});
