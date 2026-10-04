import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://voxelcurve.com',
  output: 'static',
  trailingSlash: 'never',
  compressHTML: true,
  build: { format: 'file' }
});
