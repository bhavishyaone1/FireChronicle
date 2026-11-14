import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9246;
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

  // Wait for initial render
  for (let i = 0; i < 30; i++) {
    await wait(1000);
    const ready = await evalJs(ws, `
      Boolean(
        document.body.innerText.includes('MODIS Detections') &&
        document.querySelector('canvas')
      )
    `);
    if (ready) {
      console.log('Page ready at attempt ' + i);
      break;
    }
  }

  await wait(2000);

  // 1. Expand Layers Panel
  console.log('Opening Map Layers popover...');
  await evalJs(ws, `
    const btns = Array.from(document.querySelectorAll('button'));
    const layersBtn = btns.find(b => b.innerText.includes('Layers'));
    if (layersBtn) layersBtn.click();
  `);
  await wait(800);
  await captureScreenshot(ws, 'dashboard_layers_panel_expanded.png');

  // 2. Toggle FSI Large Fire Alerts Checkbox
  console.log('Toggling FSI Large Fire Alerts...');
  await evalJs(ws, `
    const labels = Array.from(document.querySelectorAll('label'));
    const fsiLabel = labels.find(l => l.innerText.includes('FSI Large Fire'));
    if (fsiLabel) {
      const cb = fsiLabel.querySelector('input[type="checkbox"]');
      if (cb) cb.click();
    }
  `);
  await wait(800);
  await captureScreenshot(ws, 'dashboard_fsi_layer_active.png');

  // 3. Toggle Bhuvan Agricultural Fire Cues Checkbox
  console.log('Toggling Bhuvan Agri Fire Cues...');
  await evalJs(ws, `
    const labels = Array.from(document.querySelectorAll('label'));
    const bhuvanLabel = labels.find(l => l.innerText.includes('Bhuvan Agri'));
    if (bhuvanLabel) {
      const cb = bhuvanLabel.querySelector('input[type="checkbox"]');
      if (cb) cb.click();
    }
  `);
  await wait(800);
  await captureScreenshot(ws, 'dashboard_bhuvan_layer_active.png');

  // 4. Navigate to Events tab
  console.log('Navigating to Events tab...');
  await evalJs(ws, `
    const links = Array.from(document.querySelectorAll('a, button'));
    const eventsLink = links.find(l => l.innerText.trim() === 'Events' || l.innerText.includes('Candidate Events'));
    if (eventsLink) eventsLink.click();
  `);
  await wait(2000);
  await captureScreenshot(ws, 'candidate_events_tab_verified.png');

  // Check state dropdown options count
  const stateOptionsCount = await evalJs(ws, `
    const sel = document.querySelector('select');
    sel ? sel.options.length : 0
  `);
  console.log('Candidate events state dropdown options count:', stateOptionsCount);

  ws.close();
  edge.kill();
  console.log('Verification finished successfully.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
