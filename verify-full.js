const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  // Use demo via URL param to auto-trigger on load
  console.log('Loading search page with ?demo=true...');
  await page.goto('http://localhost:3000/search?demo=true', { waitUntil: 'domcontentloaded' });

  console.log('Waiting up to 90s for demo results (grants fetch ~4s + AI ranking ~22s)...');
  try {
    await page.waitForFunction(
      () => {
        const h3s = document.querySelectorAll('h3');
        return h3s.length > 2;
      },
      { timeout: 90000 }
    );
    const h3s = await page.locator('h3').allInnerTexts();
    console.log('✅ DEMO - Grant results loaded:', h3s.length, 'grants');
    console.log('   Sample:', h3s.slice(0,3).map(t => t.trim().substring(0,60)).join('\n   '));
  } catch {
    // check what state the page is in
    const bodyText = (await page.locator('body').innerText()).replace(/\s+/g,' ');
    console.log('⚠️  DEMO timed out. Page state:', bodyText.substring(0, 300));
  }
  await page.screenshot({ path: '/tmp/gc-demo-final.png', fullPage: false });

  await browser.close();
  console.log('DONE');
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
