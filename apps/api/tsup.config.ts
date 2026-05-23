import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  dts: false,
  splitting: false,
  sourcemap: false,
  target: 'es2022',
  platform: 'node',
  bundle: true,
  external: ['@neondatabase/serverless', 'bcrypt'],
});
