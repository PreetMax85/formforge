import { defineConfig, type Options } from 'tsup';

const shared: Options = {
  dts: false,
  splitting: false,
  sourcemap: false,
  target: 'es2022',
  platform: 'node',
  bundle: true,
  // resend loads @react-email/render only to render React email templates.
  // Our emails are plain text, so that import never runs; don't bundle it.
  external: ['@react-email/render'],
};

export default defineConfig([
  {
    // Long-running server (local, Docker): `node dist/index.js`. npm packages
    // stay external and resolve from node_modules. Workspace packages export
    // raw TypeScript, which Node cannot run, so they are inlined, along with
    // resend (only @repo/email depends on it, so pnpm doesn't make it
    // resolvable from apps/api). ESM because index.ts uses top-level await.
    ...shared,
    entry: ['src/index.ts'],
    outDir: 'dist',
    format: ['esm'],
    noExternal: [/^@repo\//, 'resend'],
    // Bundled CommonJS code calls require(), which ESM output lacks.
    banner: { js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);" },
  },
  {
    // Vercel function (vercel.json points the api service's outputDirectory
    // here). Vercel's Express builder runs <outputDirectory>/index.js as the
    // handler, loads it as CommonJS, and does not make node_modules
    // resolvable from it, so this is one self-contained CommonJS file.
    ...shared,
    entry: { index: 'src/serverless.ts' },
    outDir: 'dist/vercel',
    format: ['cjs'],
    outExtension: () => ({ js: '.js' }),
    noExternal: [/.*/],
    shims: true,
  },
]);
