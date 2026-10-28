import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const fixtureSourceDirectory = join(import.meta.dirname, 'fixtures/svelte-consumer');
const packages = [
  { directory: 'packages/aesir-css', name: '@aesir/css', maxPackedSize: 550_000, maxUnpackedSize: 650_000 },
  { directory: 'packages/aesir-svelte', name: '@aesir/svelte', maxPackedSize: 180_000, maxUnpackedSize: 850_000 },
  {
    directory: 'packages/aesir-html',
    name: '@aesir/html',
    maxPackedSize: 1_600_000,
    maxUnpackedSize: 3_800_000,
    fileBudgets: {
      'dist/aesir-html.min.js': 1_500_000,
      'dist/aesir-icons.min.js': 500_000
    }
  }
];
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'aesir-package-install-'));
const npmCache = join(temporaryDirectory, 'npm-cache');

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: options.cwd ?? repositoryRoot,
    encoding: 'utf8',
    env: { ...process.env, npm_config_cache: npmCache },
    stdio: options.capture ? ['ignore', 'pipe', 'inherit'] : 'inherit'
  });
}

function npm(args, options = {}) {
  return run('npm', args, options);
}

try {
  const tarballs = packages.map(({ directory, name, maxPackedSize, maxUnpackedSize, fileBudgets = {} }) => {
    const manifest = JSON.parse(readFileSync(join(repositoryRoot, directory, 'package.json'), 'utf8'));
    if (manifest.private !== true) {
      throw new Error(`${name} must remain private until publication is explicitly enabled`);
    }

    const output = npm(['pack', `./${directory}`, '--json', '--silent', '--pack-destination', temporaryDirectory], {
      capture: true
    });
    const jsonStart = output.lastIndexOf('\n[');
    const [result] = JSON.parse(output.slice(jsonStart === -1 ? 0 : jsonStart + 1));

    if (!result?.filename) {
      throw new Error(`npm pack did not create an archive for ${name}`);
    }
    if (result.size > maxPackedSize) {
      throw new Error(`${name} packed size ${result.size} exceeds its ${maxPackedSize} byte budget`);
    }
    if (result.unpackedSize > maxUnpackedSize) {
      throw new Error(`${name} unpacked size ${result.unpackedSize} exceeds its ${maxUnpackedSize} byte budget`);
    }

    const includedFiles = new Set(result.files.map(({ path }) => path));
    if (!includedFiles.has('LICENSE')) {
      throw new Error(`${name} does not include its Apache-2.0 LICENSE`);
    }
    if (name === '@aesir/svelte') {
      for (const declaration of ['dist/index.d.ts', 'dist/components/aesir-button/index.d.ts', 'dist/components/aesir-button/aesir-button.svelte.d.ts']) {
        if (!includedFiles.has(declaration)) {
          throw new Error(`${name} does not include ${declaration}`);
        }
      }
    }
    for (const { path, size } of result.files) {
      if (!['LICENSE', 'README.md', 'package.json'].includes(path) && !path.startsWith('dist/')) {
        throw new Error(`${name} unexpectedly packs ${path}`);
      }
      if (fileBudgets[path] !== undefined && size > fileBudgets[path]) {
        throw new Error(`${name} file ${path} is ${size} bytes and exceeds its ${fileBudgets[path]} byte budget`);
      }
    }

    return join(temporaryDirectory, result.filename);
  });

  const fixtureDirectory = join(temporaryDirectory, 'consumer');
  mkdirSync(join(fixtureDirectory, 'src'), { recursive: true });
  writeFileSync(join(temporaryDirectory, 'package.json'), `${JSON.stringify({ name: 'aesir-package-consumer', private: true, type: 'module' }, null, 2)}\n`);
  npm(['install', '--ignore-scripts', '--legacy-peer-deps', '--no-package-lock', '--prefix', temporaryDirectory, ...tarballs], { capture: false });

  const requireFromFixture = createRequire(join(fixtureDirectory, 'entry.mjs'));
  const expectedExports = [
    '@aesir/css/aesir-global.css',
    '@aesir/css/fonts/Inter.woff2',
    '@aesir/svelte',
    '@aesir/svelte/components/aesir-button',
    '@aesir/html',
    '@aesir/html/icons',
    '@aesir/html/components/aesir-button',
    '@aesir/html/core.css'
  ];

  for (const packageExport of expectedExports) {
    requireFromFixture.resolve(packageExport);
  }

  for (const { name } of packages) {
    const [scope, packageName] = name.split('/');
    const packageDirectory = join(temporaryDirectory, 'node_modules', scope, packageName);
    const license = readFileSync(join(packageDirectory, 'LICENSE'), 'utf8');
    if (!license.includes('Apache License')) {
      throw new Error(`${name} contains an unexpected LICENSE`);
    }
  }

  for (const packageName of ['@aesir/css', '@aesir/html']) {
    const [scope, name] = packageName.split('/');
    const notices = readFileSync(join(temporaryDirectory, 'node_modules', scope, name, 'dist', packageName === '@aesir/css' ? 'fonts/THIRD_PARTY_NOTICES.md' : 'THIRD_PARTY_NOTICES.md'), 'utf8');
    for (const marker of ['Inter', 'Geist Mono', 'SIL OPEN FONT LICENSE']) {
      if (!notices.includes(marker)) throw new Error(`${packageName} is missing ${marker} third-party notices`);
    }
    if (packageName === '@aesir/html' && !notices.includes('Lucide Icons')) throw new Error(`${packageName} is missing Lucide notices`);
  }

  const installedSvelteRoot = join(temporaryDirectory, 'node_modules/@aesir/svelte');
  const componentExports = readdirSync(join(installedSvelteRoot, 'dist/components'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('aesir-') && existsSync(join(installedSvelteRoot, 'dist/components', entry.name, 'index.js')))
    .map((entry) => `@aesir/svelte/components/${entry.name}`)
    .sort();
  const iconExports = readdirSync(join(installedSvelteRoot, 'dist/icons'), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.svelte'))
    .map((entry) => `@aesir/svelte/icons/${entry.name.slice(0, -'.svelte'.length)}`)
    .sort();
  const typedSvelteExports = ['@aesir/svelte', ...componentExports, ...iconExports, '@aesir/svelte/utilities/merge-props', '@aesir/svelte/utilities/overlay'];

  const fixtureNodeModules = join(temporaryDirectory, 'node_modules');
  const linkDependency = (dependency) => {
    const target = join(repositoryRoot, 'node_modules', ...dependency.split('/'));
    const link = join(fixtureNodeModules, ...dependency.split('/'));
    mkdirSync(resolve(link, '..'), { recursive: true });
    symlinkSync(target, link, 'junction');
  };

  for (const dependency of ['svelte', 'svelte-check', 'typescript', 'vite', '@lucide/svelte', '@sveltejs/vite-plugin-svelte']) {
    linkDependency(dependency);
  }

  writeFileSync(join(fixtureDirectory, 'index.html'), '<!doctype html><html><body><div id="app"></div><script type="module" src="/src/main.ts"></script></body></html>\n');
  copyFileSync(join(fixtureSourceDirectory, 'App.svelte'), join(fixtureDirectory, 'src/App.svelte'));
  copyFileSync(join(fixtureSourceDirectory, 'JavaScriptApp.svelte'), join(fixtureDirectory, 'src/JavaScriptApp.svelte'));
  writeFileSync(join(fixtureDirectory, 'svelte.config.js'), 'export default {};\n');
  writeFileSync(
    join(fixtureDirectory, 'src/main.ts'),
    `import { mount } from 'svelte';\nimport '@aesir/css/aesir-global.css';\nimport App from './App.svelte';\n\nmount(App, { target: document.querySelector('#app')! });\n`
  );
  writeFileSync(
    join(fixtureDirectory, 'src/package-exports.ts'),
    `${typedSvelteExports.map((specifier, index) => `import * as PackageExport${index} from '${specifier}';`).join('\n')}\n\nvoid [${typedSvelteExports.map((_, index) => `PackageExport${index}`).join(', ')}];\n`
  );
  writeFileSync(join(fixtureDirectory, 'javascript.html'), '<!doctype html><html><body><div id="app"></div><script type="module" src="/src/javascript.js"></script></body></html>\n');
  writeFileSync(
    join(fixtureDirectory, 'src/javascript.js'),
    `import { mount } from 'svelte';\nimport '@aesir/css/aesir-global.css';\nimport App from './JavaScriptApp.svelte';\n\nmount(App, { target: document.querySelector('#app') });\n`
  );
  writeFileSync(
    join(fixtureDirectory, 'plain.html'),
    '<!doctype html><html><body><aesir-button variant="accent">Installed package</aesir-button><script type="module" src="/src/plain.js"></script></body></html>\n'
  );
  writeFileSync(join(fixtureDirectory, 'src/plain.js'), `import '@aesir/html/core.css';\nimport '@aesir/html/components/aesir-button';\n`);
  writeFileSync(
    join(fixtureDirectory, 'vite.config.js'),
    `import { resolve } from 'node:path';\nimport { defineConfig } from 'vite';\nimport { svelte } from '@sveltejs/vite-plugin-svelte';\n\nexport default defineConfig({\n  plugins: [svelte()],\n  build: {\n    rollupOptions: {\n      input: {\n        javascript: resolve(import.meta.dirname, 'javascript.html'),\n        plain: resolve(import.meta.dirname, 'plain.html'),\n        typescript: resolve(import.meta.dirname, 'index.html')\n      },\n      output: {\n        manualChunks(id) {\n          if (id.includes('/node_modules/svelte/')) return 'svelte';\n        }\n      }\n    }\n  }\n});\n`
  );
  writeFileSync(
    join(fixtureDirectory, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          allowJs: true,
          checkJs: false,
          esModuleInterop: true,
          forceConsistentCasingInFileNames: true,
          module: 'ESNext',
          moduleResolution: 'bundler',
          resolveJsonModule: true,
          skipLibCheck: true,
          strict: true,
          target: 'ES2022'
        },
        include: ['src/**/*.svelte', 'src/**/*.ts']
      },
      null,
      2
    )}\n`
  );

  run(process.execPath, [join(repositoryRoot, 'node_modules/svelte-check/bin/svelte-check'), '--tsconfig', './tsconfig.json'], {
    cwd: fixtureDirectory
  });

  run(process.execPath, [join(repositoryRoot, 'node_modules/vite/bin/vite.js'), 'build'], {
    cwd: fixtureDirectory
  });

  console.log(
    `Package consumer check passed (${packages.length} archives within budget, ${expectedExports.length} representative runtime exports, ${typedSvelteExports.length} typed Svelte exports, strict TypeScript check, JavaScript and TypeScript Svelte builds, and a plain HTML build).`
  );
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
