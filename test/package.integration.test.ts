import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { build, preview } from 'vite';
import { vibe } from '@usevibejs/compiler/vite';
import { chromium } from 'playwright';
import { expect, it, onTestFinished } from 'vitest';
it('consumes the packed ESM package and declarations in an independent production app', async () => {
  const root = mkdtempSync(join(tmpdir(), 'vibetable-consumer-'));
  onTestFinished(() => rmSync(root, { recursive: true, force: true }));
  execFileSync('pnpm', ['pack', '--pack-destination', root], { cwd: resolve('.'), stdio: 'pipe' });
  const archive = join(
    root,
    readdirSync(root).find((file) => file.endsWith('.tgz'))!,
  );
  const manifest = JSON.parse(
    execFileSync('tar', ['-xOf', archive, 'package/package.json'], { encoding: 'utf8' }),
  );
  expect(manifest.name).toBe('@usevibejs/table');
  expect(manifest.dependencies['@tanstack/table-core']).toBe('9.3.1');
  expect(JSON.stringify(manifest)).not.toMatch(/catalog:|workspace:|link:|file:|\/Users\//);
  expect(manifest.peerDependencies['@usevibejs/ui']).toBe('^0.1.0');
  expect(manifest.sideEffects).toBe(false);
  const files = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8' });
  expect(files).toContain('dist/index.js.map');
  expect(files).toContain('dist/index.d.ts');
  expect(files).not.toContain('examples/');
  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify({
      private: true,
      type: 'module',
      dependencies: { '@usevibejs/table': `file:${archive}`, '@usevibejs/ui': '0.1.0' },
      devDependencies: {
        '@usevibejs/compiler': '0.1.0',
        '@usevibejs/language-tools': '0.1.0',
        typescript: '7.1.0-dev.20261015.1',
        vite: '8.3.4',
      },
    }),
  );
  execFileSync('pnpm', ['install', '--ignore-scripts', '--config.minimumReleaseAge=0'], {
    cwd: root,
    stdio: 'pipe',
    timeout: 60000,
  });
  for (const file of [
    'Content.vibe',
    'AmountCell.vibe',
    'NameHeader.vibe',
    'Table.vibe',
    'types.ts',
  ]) {
    writeFileSync(
      join(root, file),
      readFileSync(resolve('test/fixtures', file), 'utf8').replaceAll(
        '../../src/index.ts',
        '@usevibejs/table',
      ),
    );
  }
  writeFileSync(
    join(root, 'App.vibe'),
    `<script setup lang="ts">import Table from "./Table.vibe";</script><template><Table :data="[{id: 'a', name: 'Ada', amount: 42.25}]" /></template>`,
  );
  writeFileSync(
    join(root, 'main.ts'),
    "import { createApp } from '@usevibejs/ui'; import App from './App.vibe'; createApp(App).mount('#app');",
  );
  writeFileSync(
    join(root, 'index.html'),
    '<!doctype html><html lang="en"><body><div id="app"></div><script type="module" src="/main.ts"></script></body></html>',
  );
  writeFileSync(
    join(root, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'es2022',
        module: 'preserve',
        lib: ['es2024', 'dom'],
        strict: true,
        noEmit: true,
        allowImportingTsExtensions: true,
        skipLibCheck: true,
      },
      contentMappers: [{ package: '@usevibejs/language-tools', extensions: ['.vibe'] }],
      include: ['*.ts', '*.vibe'],
    }),
  );
  execFileSync('pnpm', ['exec', 'tsc', '-b', '--runExternalCode'], { cwd: root, stdio: 'inherit' });
  await build({ root, configFile: false, logLevel: 'silent', plugins: [vibe()] });
  const server = await preview({
    root,
    configFile: false,
    logLevel: 'silent',
    preview: { host: '127.0.0.1', port: 0 },
  });
  onTestFinished(() => new Promise<void>((done) => server.httpServer.close(() => done())));
  const browser = await chromium.launch();
  onTestFinished(() => browser.close());
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(server.resolvedUrls!.local[0]);
  await page.locator('strong').waitFor();
  expect(await page.locator('strong').textContent()).toBe('42.25');
  await page.getByRole('checkbox', { name: 'Select Ada' }).check();
  expect(await page.locator('strong').getAttribute('data-selected')).toBe('true');
  expect(errors).toEqual([]);
}, 120000);
