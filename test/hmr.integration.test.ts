import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { vibe } from '@usevibejs/compiler/vite';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { expect, it, onTestFinished } from 'vitest';
it('preserves table state on template HMR and disposes instances on script replacement', async () => {
  mkdirSync('test/.tmp', { recursive: true });
  const root = mkdtempSync(resolve('test/.tmp/hmr-'));
  onTestFinished(() => rmSync(root, { recursive: true, force: true }));
  cpSync('test/hmr', root, { recursive: true });
  const server = await createServer({
    root,
    configFile: false,
    logLevel: 'silent',
    plugins: [vibe()],
    server: { host: '127.0.0.1', port: 0, watch: null },
  });
  onTestFinished(() => server.close());
  await server.listen();
  const browser = await chromium.launch();
  onTestFinished(() => browser.close());
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(server.resolvedUrls!.local[0]);
  const button = page.getByRole('button');
  await button.waitFor();
  await button.click();
  await expect.poll(() => button.textContent()).toBe('2 / true');
  const file = join(root, 'App.vibe');
  const edit = (from: string, to: string) => {
    writeFileSync(file, readFileSync(file, 'utf8').replace(from, to));
    server.watcher.emit('change', file);
  };
  edit('Original template', 'Updated template');
  await page.getByText('Updated template').waitFor();
  expect(await button.textContent()).toBe('2 / true');
  edit('ref(1)', 'ref(10)');
  await expect.poll(() => button.textContent(), { timeout: 10000 }).toBe('10 / false');
  await button.click();
  await expect.poll(() => button.textContent()).toBe('11 / true');
  expect(errors).toEqual([]);
});
