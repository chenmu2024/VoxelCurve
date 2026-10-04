import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://voxelcurve.com',
  output: 'static',
  integrations: [sitemap({
    filter: (page) => !page.includes('/404')
  })],
  build: { format: 'directory' }
});
