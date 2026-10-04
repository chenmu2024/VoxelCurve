import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir:'./tests/e2e',
  testMatch:'**/*.pw.ts',
  workers:2,
  use:{baseURL:'http://127.0.0.1:4321',trace:'retain-on-failure'},
  webServer:{command:'node scripts/preview-test.mjs',url:'http://127.0.0.1:4321',reuseExistingServer:!process.env.CI},
  projects:[
    {name:'chrome-desktop',use:{...devices['Desktop Chrome']}},
    {name:'chrome-mobile',use:{...devices['Pixel 7'],viewport:{width:375,height:812}}},
    {name:'firefox',use:{...devices['Desktop Firefox']}},
    {name:'webkit-mobile',use:{...devices['iPhone 13'],viewport:{width:375,height:812}}}
  ]
});
