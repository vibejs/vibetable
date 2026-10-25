import { resolve } from 'node:path';
import { build, preview } from 'vite';
import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';
import type { PreviewServer } from 'vite';
import { afterAll, beforeAll, expect, it } from 'vitest';
let browser: Browser;
let page: Page;
let server: PreviewServer;
let origin: string;
const errors: string[] = [];
beforeAll(async () => {
  await build({ root: resolve('examples/kitchen-sink'), logLevel: 'silent' });
  server = await preview({
    root: resolve('examples/kitchen-sink'),
    logLevel: 'silent',
    preview: { host: '127.0.0.1', port: 0 },
  });
  origin = server.resolvedUrls!.local[0];
  browser = await chromium.launch();
  page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
});
afterAll(async () => {
  await browser?.close();
  await new Promise<void>((done) => server?.httpServer.close(() => done()));
});
it('mounts every working example without runtime errors and switches themes', async () => {
  for (const id of [
    'basic',
    'payments',
    'customers',
    'products',
    'invoices',
    'selection',
    'columns',
    'server',
    'hierarchy',
    'virtualized',
  ]) {
    await page.goto(origin + '?example=' + id);
    await page.locator('main table').waitFor();
    if (id !== 'virtualized') await page.locator('main tbody tr').first().waitFor();
    expect(await page.locator('main caption').count()).toBe(1);
  }
  await page.getByRole('button', { name: 'Dark mode', exact: true }).click();
  expect(await page.locator('.dark').count()).toBe(1);
  await page.getByRole('button', { name: 'Light mode', exact: true }).click();
  expect(errors).toEqual([]);
});
it('uses menu keyboard navigation, filters, pagination, selection, row actions and density', async () => {
  await page.goto(origin + '?example=payments');
  const table = page.locator('main table');
  await table.getByText('olivia.rhye@example.com', { exact: true }).waitFor();
  await page.getByRole('checkbox', { name: 'Select olivia.rhye@example.com', exact: true }).check();
  expect(
    await page
      .getByRole('checkbox', { name: 'Select all payments on this page' })
      .evaluate((input: HTMLInputElement) => input.indeterminate),
  ).toBe(true);
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await table.getByText('natali.craig@example.com', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Sort Customer', exact: true }).press('Enter');
  await page.getByRole('menuitem', { name: 'Sort ascending', exact: true }).focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect.poll(() => table.locator('th[aria-sort="descending"]').count()).toBe(1);
  await page.getByRole('searchbox', { name: 'Search payments' }).fill('olivia');
  await expect.poll(() => table.locator('tbody tr').count()).toBe(3);
  await page.getByRole('button', { name: 'View', exact: true }).click();
  await page.getByRole('menuitemcheckbox', { name: 'Amount', exact: true }).click();
  expect(await table.getByRole('columnheader', { name: 'Amount' }).count()).toBe(0);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Compact rows', exact: true }).click();
  expect(await page.locator('[data-density="compact"]').count()).toBe(1);
  await page.getByRole('searchbox', { name: 'Search payments' }).fill('missing');
  await table.getByText('No results', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Reset filters', exact: true }).click();
  await expect.poll(() => table.locator('tbody tr').count()).toBe(5);
  await page.getByRole('button', { name: 'Mark as paid', exact: true }).click();
  await page.getByText('1 payment marked as paid.', { exact: true }).waitFor();
  await page.getByRole('searchbox', { name: 'Search payments' }).fill('PAY-1048');
  const row = table.locator('[data-row-id="PAY-1048"]');
  await row.getByRole('button', { name: 'Actions for PAY-1048' }).click();
  await page.getByRole('menuitem', { name: 'Refund payment', exact: true }).click();
  await row.getByText('Refunded', { exact: true }).waitFor();
  expect(await page.getByRole('link', { name: 'Export payments' }).getAttribute('href')).toMatch(
    /^data:text\/csv/,
  );
});
it('preserves row DOM on selection and exposes accessible column resize controls', async () => {
  await page.goto(origin + '?example=payments');
  const tbody = page.locator('main tbody');
  await tbody.locator('tr').first().waitFor();
  await tbody.evaluate((element) => {
    const record = { changes: 0 };
    Object.assign(window, { tableMutations: record });
    new MutationObserver((records) => {
      record.changes += records.filter((change) => change.type === 'childList').length;
    }).observe(element, { subtree: true, childList: true });
  });
  await page.getByRole('checkbox', { name: 'Select olivia.rhye@example.com', exact: true }).check();
  expect(
    await page.evaluate(
      () => (window as unknown as { tableMutations: { changes: number } }).tableMutations.changes,
    ),
  ).toBe(0);
  await page.goto(origin + '?example=columns');
  const handle = page.getByRole('separator', { name: 'Resize name', exact: true });
  await handle.waitFor();
  const before = Number(await handle.getAttribute('aria-valuenow'));
  await handle.focus();
  await handle.press('ArrowRight');
  expect(Number(await handle.getAttribute('aria-valuenow'))).toBe(before + 10);
  const rect = await handle.boundingBox();
  await page.mouse.move(rect!.x + rect!.width / 2, rect!.y + 5);
  await page.mouse.down();
  await page.mouse.move(rect!.x + 35, rect!.y + 5);
  await page.mouse.up();
  expect(Number(await handle.getAttribute('aria-valuenow'))).toBeGreaterThan(before + 10);
});
it('combines category and numeric filters and resets their controls', async () => {
  await page.goto(origin + '?example=products');
  const table = page.locator('main table');
  const minimum = page.getByRole('spinbutton', { name: 'Minimum price' });
  await minimum.fill('500');
  await page.getByRole('button', { name: '+ Category', exact: true }).click();
  await page.getByRole('menuitemcheckbox', { name: /Software/ }).click();
  await page.keyboard.press('Escape');
  await expect.poll(() => table.locator('tbody tr[data-row-id]').count()).toBeGreaterThan(0);
  for (const row of await table.locator('tbody tr[data-row-id]').all()) {
    expect(await row.locator('td').nth(1).textContent()).toBe('Software');
    expect(
      Number((await row.locator('td').nth(2).textContent())!.replace('$', '')),
    ).toBeGreaterThanOrEqual(500);
  }
  await page.getByRole('button', { name: 'Reset filters', exact: true }).click();
  await expect.poll(() => minimum.inputValue()).toBe('');
});
it('releases an in-progress resize when its component is removed', async () => {
  await page.goto(origin + '?example=columns');
  const handle = page.getByRole('separator', { name: 'Resize name', exact: true });
  await handle.waitFor();
  await page.evaluate(() => {
    const listeners = new Set<EventListenerOrEventListenerObject>();
    const add = document.addEventListener.bind(document);
    const remove = document.removeEventListener.bind(document);
    document.addEventListener = ((
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ) => {
      if (type === 'mousemove' || type === 'mouseup') listeners.add(listener);
      add(type, listener, options);
    }) as typeof document.addEventListener;
    document.removeEventListener = ((
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | EventListenerOptions,
    ) => {
      if (type === 'mousemove' || type === 'mouseup') listeners.delete(listener);
      remove(type, listener, options);
    }) as typeof document.removeEventListener;
    Object.assign(window, { activeResizeListeners: () => listeners.size });
  });
  const count = () =>
    page.evaluate(() =>
      (window as unknown as { activeResizeListeners: () => number }).activeResizeListeners(),
    );
  const rect = await handle.boundingBox();
  await page.mouse.move(rect!.x + 1, rect!.y + 5);
  await page.mouse.down();
  await page.mouse.move(rect!.x + 30, rect!.y + 5);
  expect(await count()).toBe(2);
  // Programmatic navigation preserves the pressed mouse, exercising disposal before mouseup.
  await page
    .getByRole('button', { name: 'Basic table', exact: true })
    .evaluate((button) => (button as HTMLButtonElement).click());
  await page.getByRole('heading', { name: 'A table, with nothing extra', exact: true }).waitFor();
  expect(await count()).toBe(0);
  await page.mouse.up();
});
it('fetches manual server pages, sorts and filters through actual HTTP requests, and recovers from errors', async () => {
  await page.goto(origin + '?example=server');
  const table = page.locator('main table');
  await table.getByText('Ada Lovelace', { exact: true }).first().waitFor();
  expect(await table.locator('tbody tr[data-row-id]').count()).toBe(10);
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await page.getByText('Page 2 of 120', { exact: true }).waitFor();
  await page.getByRole('searchbox', { name: 'Search remote invoices' }).fill('Grace');
  await table.getByText('Grace Hopper', { exact: true }).first().waitFor();
  expect(await table.locator('tbody tr[data-row-id]').count()).toBe(10);
  await page.route('**/api/invoices?*', (route) =>
    route.fulfill({ status: 503, contentType: 'application/json', body: '{}' }),
  );
  await page.getByRole('searchbox', { name: 'Search remote invoices' }).fill('Ada');
  await page.getByRole('alert').waitFor();
  await page.unroute('**/api/invoices?*');
  await page.getByRole('button', { name: 'Try again' }).click();
  await table.getByText('Ada Lovelace', { exact: true }).first().waitFor();
  // The expected HTTP 503 is logged by Chromium as a failed resource, outside framework errors.
});
it('bounds DOM rows for large datasets, scrolls to real data and reports measured performance', async () => {
  const measurements = [];
  for (const count of [1000, 10000, 50000]) {
    await page.goto(origin + '?example=virtualized&rows=' + count);
    await page.locator('[data-virtual-row="0"]').waitFor();
    const rendered = await page.locator('[data-virtual-row]').count();
    expect(rendered).toBeGreaterThan(5);
    expect(rendered).toBeLessThan(60);
    expect(await page.locator('main table').getAttribute('aria-rowcount')).toBe(String(count + 1));
    await page.getByRole('button', { name: 'Jump to middle row' }).click();
    await page.locator('[data-virtual-row="' + count / 2 + '"]').waitFor();
    expect(await page.locator('[data-virtual-row]').count()).toBeLessThan(60);
    const model = await page.locator('[data-metric="model"]').textContent();
    expect(model).toMatch(/\d+\.\d+ ms/);
    const domNodes = await page.locator('main table').evaluate((table) => {
      const walker = document.createTreeWalker(table, NodeFilter.SHOW_ALL);
      let nodes = 1;
      while (walker.nextNode()) nodes++;
      return nodes;
    });
    expect(domNodes).toBeLessThan(3000);
    measurements.push({
      count,
      domNodes,
      renderedRows: rendered,
      rowModel: model,
      mount: await page.locator('[data-metric="mount"]').textContent(),
    });
  }
  process.stdout.write(JSON.stringify({ virtualizedBrowser: measurements }) + '\n');
});
it('fits mobile layouts and keeps expandable children interactive', async () => {
  await page.goto(origin + '?example=hierarchy');
  await page.getByRole('button', { name: 'Expand Engineering', exact: true }).click();
  expect(await page.locator('main tbody tr').count()).toBe(5);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin + '?example=payments');
  await page.locator('main table').waitFor();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
});
