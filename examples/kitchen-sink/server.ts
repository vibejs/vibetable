import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { createRecords } from './src/records.ts';
const rows = createRecords(1200);
function invoices(request: IncomingMessage, response: ServerResponse, next: () => void): void {
  const url = new URL(request.url ?? '/', 'http://localhost');
  if (url.pathname !== '/api/invoices') return next();
  const query = (url.searchParams.get('search') ?? '').toLowerCase();
  const size = Math.min(100, Math.max(1, Number(url.searchParams.get('size')) || 10));
  const page = Math.max(0, Number(url.searchParams.get('page')) || 0);
  const id = url.searchParams.get('sort') === 'amount' ? 'amount' : 'name';
  const desc = url.searchParams.get('desc') === 'true' ? -1 : 1;
  const result = rows
    .filter((row) => (row.name + ' ' + row.id).toLowerCase().includes(query))
    .sort((a, b) => desc * (id === 'amount' ? a.amount - b.amount : a.name.localeCompare(b.name)));
  response.setHeader('Content-Type', 'application/json');
  response.setHeader('Cache-Control', 'no-store');
  response.end(
    JSON.stringify({ rows: result.slice(page * size, (page + 1) * size), rowCount: result.length }),
  );
}
/** A real local HTTP endpoint shared by development and production-preview tests. */
export function invoiceApi(): Plugin {
  return {
    name: 'example-invoice-api',
    configureServer(server) {
      server.middlewares.use(invoices);
    },
    configurePreviewServer(server) {
      server.middlewares.use(invoices);
    },
  };
}
