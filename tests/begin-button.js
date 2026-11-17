// For many window sizes: what element actually receives a click at the centre of the Begin button?
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('file://' + require('path').resolve(__dirname, '..', 'index.html'));
  await page.waitForTimeout(800);
  const bad = [], sizes = [];
  for (const w of [320, 360, 390, 414, 480, 560, 640, 720, 768, 900, 1024, 1280, 1440]) for (const h of [390, 480, 568, 640, 720, 800, 844, 900, 1000]) sizes.push([w, h]);
  for (const [w, h] of sizes) {
    await page.setViewportSize({ width: w, height: h });
    const r = await page.evaluate(() => {
      const b = document.getElementById('begin').getBoundingClientRect(), hit = {};
      for (const fx of [0.15, 0.5, 0.85]) for (const fy of [0.2, 0.5, 0.8]) { const e = document.elementFromPoint(b.left + b.width * fx, b.top + b.height * fy); const k = e ? (e.id || e.tagName) : 'none'; hit[k] = (hit[k] || 0) + 1; }
      return { hit, inView: b.top >= 0 && b.bottom <= innerHeight };
    });
    if (r.hit.begin !== 9 || !r.inView) bad.push(`${w}x${h} ${JSON.stringify(r)}`);
  }
  console.log(`${bad.length} of ${sizes.length} sizes where Begin is not what gets the click:`);
  console.log(bad.join('\n'));
  await browser.close();
})();
