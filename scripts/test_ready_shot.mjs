import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9266;
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
    const hasPointsBtn = await evalJs(ws, `!!document.querySelector('[data-view-btn="points"]')`);
    console.log(`Second ${i+1}: hasData=${hasData}, hasCanvas=${hasCanvas}, hasPointsBtn=${hasPointsBtn}`);
    if (hasData && hasCanvas && hasPointsBtn) {
      console.log('Ready!');
      break;
    }
  }

  await wait(2000);

  // 1. Mode A: Hotspot Points
  console.log('Capturing Mode A: Points...');
  await captureScreenshot(ws, 'verified_mode_a_points.png');

  // 2. Mode B: Detection Density
  console.log('Capturing Mode B: Density Heatmap...');
  await evalJs(ws, `document.querySelector('[data-view-btn="density"]')?.click()`);
  await wait(2500);
  await captureScreenshot(ws, 'verified_mode_b_density.png');

  // 3. Mode C: FRP Intensity
  console.log('Capturing Mode C: FRP Intensity...');
  await evalJs(ws, `document.querySelector('[data-view-btn="frp"]')?.click()`);
  await wait(2500);
  await captureScreenshot(ws, 'verified_mode_c_frp.png');

  // 4. Mode D: Radiometry (MWIR)
  console.log('Capturing Mode D: Radiometry (MWIR)...');
  await evalJs(ws, `document.querySelector('[data-view-btn="brightness"]')?.click()`);
  await wait(2500);
  await captureScreenshot(ws, 'verified_mode_d_radiometry.png');

  // 5. Mode E: 1 km Grid
  console.log('Capturing Mode E: 1 km Grid...');
  await evalJs(ws, `document.querySelector('[data-view-btn="grid"]')?.click()`);
  await wait(2500);
  await captureScreenshot(ws, 'verified_mode_e_grid.png');

  // 6. Timeline Playback Active
  console.log('Testing Timeline Playback...');
  await evalJs(ws, `
    document.querySelector('[data-view-btn="points"]')?.click();
    document.querySelector('button[title*="Play"]')?.click();
  `);
  await wait(3000);
  await captureScreenshot(ws, 'verified_timeline_playing.png');

  ws.close();
  edge.kill();
  console.log('All verified captures complete!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
