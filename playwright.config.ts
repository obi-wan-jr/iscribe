import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './tests',
	timeout: 30_000,
	expect: { timeout: 5_000 },
	reporter: [['list']],
	use: {
		baseURL: process.env.BASE_URL || 'http://localhost:3008',
		headless: true,
		trace: 'on-first-retry',
	},
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
	],
	webServer: {
		command: 'node server.js',
		port: 3008,
		reuseExistingServer: true,
		timeout: 60_000,
	},
});
