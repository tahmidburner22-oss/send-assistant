import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto('https://adaptly.co.uk/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
const title = await page.title();
console.log('Title:', title);
await browser.close();
console.log('Smoke test passed');
