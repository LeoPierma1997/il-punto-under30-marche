const { chromium } = require('playwright');
const FPS = 30, PAGE = process.argv[2] || 'puntata-01.html';
const only = process.argv[3] ? process.argv[3].split(',').map(Number) : null;
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8766/' + PAGE); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
  const TOTAL = await p.evaluate(() => window.TOTAL);
  const frames = only ? only.map(s => Math.round(s * FPS)) : [...Array(Math.round(FPS * TOTAL)).keys()];
  for (const f of frames) {
    await p.evaluate(t => window.render(t), f / FPS);
    await p.screenshot({ path: __dirname + (only ? '/prova/t-' + (f / FPS).toFixed(2) + '.jpg' : '/frames/f' + String(f).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 92 });
  }
  console.log('TOTAL', TOTAL, 'frames', frames.length, 'ERRS', errs);
  await b.close();
})();
