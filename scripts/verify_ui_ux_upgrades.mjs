import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9245;
const SCREENSHOT_DIR = 'C:\\Users\\bhavishya\\.gemini\\antigravity\\brain\\53073b53-3816-43e9-9032-999fd9626f0e\\screenshots';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendCdp(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evalJs(ws, expression) {
  const res = await sendCdp(ws, 'Runtime.evaluate', { expression, returnByValue: true });
  return res.result?.value;
}

async function captureScreenshot(ws, filename) {
  const outPath = path.join(SCREENSHOT_DIR, filename);
  const shot = await sendCdp(ws, 'Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
  console.log(`[CAPTURED] ${filename}`);
}

async function run() {
  console.log('Launching Edge on port ' + PORT + '...');
  const edge = spawn(EDGE_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--window-size=1520,1020',
    '--enable-webgl',
    'about:blank',
  ]);

  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await wait(500);
    try {
      const resp = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      const data = await resp.json();
      if (data.webSocketDebuggerUrl) {
        wsUrl = data.webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!wsUrl) {
    console.error('Failed to connect to Edge');
    edge.kill();
    process.exit(1);
  }

  const targetsResp = await fetch(`http://127.0.0.1:${PORT}/json`);
  const targets = await targetsResp.json();
  const pageTarget = targets.find((t) => t.type === 'page' && !t.url.startsWith('devtools:')) || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener('open', resolve));

  await sendCdp(ws, 'Runtime.enable');
  await sendCdp(ws, 'Page.enable');
  await sendCdp(ws, 'DOM.enable');

  console.log('Navigating to http://localhost:3000/#overview...');
  await sendCdp(ws, 'Page.navigate', { url: 'http://localhost:3000/#overview' });

  // Wait for loading to finish and map canvas to be ready
  console.log('Waiting for data to load and render...');
  for (let i = 0; i < 20; i++) {
    await wait(1000);
    const hasData = await evalJs(ws, `document.body.innerText.includes('MODIS Detections') && !document.body.innerText.includes('Loading active-fire observations...')`);
    const hasCanvas = await evalJs(ws, `!!document.querySelector('.maplibregl-canvas')`);
    console.log(`Second ${i+1}: hasData=${hasData}, hasCanvas=${hasCanvas}`);
    if (hasData && hasCanvas) {
      console.log('Ready!');
      break;
    }
  }

  await wait(2500);

  // 1. Capture base overview with all new UI/UX components
  console.log('Capturing Upgraded Overview Dashboard...');
  await captureScreenshot(ws, 'dashboard_upgraded_overview.png');

  // 2. Click MODIS Detections KPI card to test interactive filtering
  console.log('Testing KPI card click: MODIS Detections...');
  await evalJs(ws, `
    const modisCard = Array.from(document.querySelectorAll('[role="button"]')).find(el => el.innerText.includes('MODIS Detections'));
    if (modisCard) modisCard.click();
  `);
  await wait(2000);
  await captureScreenshot(ws, 'dashboard_upgraded_modis_filter.png');

  // Reset to ALL by clicking MODIS again
  await evalJs(ws, `
    const modisCard = Array.from(document.querySelectorAll('[role="button"]')).find(el => el.innerText.includes('MODIS Detections'));
    if (modisCard) modisCard.click();
  `);
  await wait(1500);

  // 3. Test next hotspot stepper in Observation Details Panel
  console.log('Testing observation stepper next button...');
  await evalJs(ws, `
    const nextBtn = document.querySelector('button[title*="Next hotspot"]');
    if (nextBtn) nextBtn.click();
  `);
  await wait(2000);
  await captureScreenshot(ws, 'dashboard_upgraded_stepper_next.png');

  // 4. Test "Fit to active detections" button
  console.log('Testing Fit to active detections button...');
  await evalJs(ws, `
    const fitBtn = document.querySelector('button[title*="Fit map view to active detections"]');
    if (fitBtn) fitBtn.click();
  `);
  await wait(2000);
  await captureScreenshot(ws, 'dashboard_upgraded_fit_detections.png');

  ws.close();
  edge.kill();
  console.log('All UI/UX upgrade captures complete!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
