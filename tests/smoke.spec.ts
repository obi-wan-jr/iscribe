import { test, expect } from '@playwright/test';

const api = (path: string) => `/api${path}`;

test.describe('iScribe UI + API smoke', () => {
	test('loads home page and assets', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/iScribe/i);
		await expect(page.locator('h1')).toHaveText(/iScribe/i);
		// scripts/styles load
		const [scriptResp, styleResp] = await Promise.all([
			page.waitForResponse((r) => r.url().includes('/script.js') && r.ok()),
			page.waitForResponse((r) => r.url().includes('/styles.css') && r.ok()),
		]);
		expect(scriptResp.ok()).toBeTruthy();
		expect(styleResp.ok()).toBeTruthy();
	});

	test('health endpoint responds', async ({ page, request }) => {
		const resp = await request.get(api('/health'));
		expect(resp.status()).toBe(200);
		const json = await resp.json();
		expect(json).toHaveProperty('status');
		expect(json).toHaveProperty('services');
	});

	test('files endpoint returns list', async ({ request }) => {
		const resp = await request.get(api('/files'));
		expect(resp.status()).toBe(200);
		const json = await resp.json();
		expect(json).toHaveProperty('files');
	});
});
