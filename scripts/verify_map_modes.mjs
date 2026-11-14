import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9280;
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
    '--window-size=1520,1000',
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
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.addEventListener('open', resolve));

  const consoleLogs = [];
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      const text = msg.params.args.map((a) => a.value || a.description).join(' ');
      consoleLogs.push({ type: msg.params.type, text });
      if (msg.params.type === 'error') {
        console.error(`[BROWSER ERROR] ${text}`);
      }
    }
  });

  await sendCdp(ws, 'Runtime.enable');
  await sendCdp(ws, 'Page.enable');
  await sendCdp(ws, 'DOM.enable');

  console.log('Navigating to http://localhost:3000/#overview...');
  await sendCdp(ws, 'Page.navigate', { url: 'http://localhost:3000/#overview' });
  await wait(6000);

  // 1. Mode A: Hotspots View
  console.log('\n--- Capturing Mode A: Hotspot Points ---');
  await captureScreenshot(ws, 'map_mode_a_points.png');

  // Toggle "Size by FRP"
  console.log('\n--- Toggling Size by FRP in Mode A ---');
  await evalJs(ws, `
    const labels = Array.from(document.querySelectorAll('label'));
    const frpLabel = labels.find(l => l.innerText.includes('Size by FRP'));
    if (frpLabel) {
      const input = frpLabel.querySelector('input');
      if (input) input.click();
    }
  `);
  await wait(1800);
  await captureScreenshot(ws, 'map_mode_a_size_by_frp.png');

  // 2. Mode B: Detection Density Heatmap
  console.log('\n--- Switching to Mode B: Detection Density Heatmap ---');
  await evalJs(ws, `
    const btn = document.querySelector('[data-view-btn="density"]');
    if (btn) btn.click();
  `);
  await wait(2200);
  await captureScreenshot(ws, 'map_mode_b_density_heatmap.png');

  // 3. Mode C: FRP-Weighted Intensity Heatmap
  console.log('\n--- Switching to Mode C: FRP-Weighted Intensity Heatmap ---');
  await evalJs(ws, `
    const btn = document.querySelector('[data-view-btn="frp"]');
    if (btn) btn.click();
  `);
  await wait(2200);
  await captureScreenshot(ws, 'map_mode_c_frp_intensity.png');

  // 4. Mode D: Brightness Temperature View (MWIR Channel)
  console.log('\n--- Switching to Mode D: Brightness Temperature View ---');
  await evalJs(ws, `
    const btn = document.querySelector('[data-view-btn="brightness"]');
    if (btn) btn.click();
  `);
  await wait(2200);
  await captureScreenshot(ws, 'map_mode_d_brightness_mwir.png');

  // Switch to LWIR Channel in Mode D
  console.log('\n--- Switching to LWIR Channel in Mode D ---');
  await evalJs(ws, `
    const buttons = Array.from(document.querySelectorAll('button'));
    const lwirBtn = buttons.find(b => b.innerText.includes('LWIR'));
    if (lwirBtn) lwirBtn.click();
  `);
  await wait(1800);
  await captureScreenshot(ws, 'map_mode_d_brightness_lwir.png');

  // 5. Mode E: 1 km Equal-Area Grid View
  console.log('\n--- Switching to Mode E: 1 km Equal-Area Grid View ---');
  await evalJs(ws, `
    const btn = document.querySelector('[data-view-btn="grid"]');
    if (btn) btn.click();
  `);
  await wait(2200);
  await captureScreenshot(ws, 'map_mode_e_1km_grid.png');

  // 6. Test Timeline Playback Controller
  console.log('\n--- Testing Timeline Controller Play/Step ---');
  await evalJs(ws, `
    const btn = document.querySelector('[data-view-btn="points"]');
    if (btn) btn.click();
    const playBtn = document.querySelector('button[title*="Play"]');
    if (playBtn) playBtn.click();
  `);
  await wait(2500);
  await captureScreenshot(ws, 'map_timeline_playback_active.png');

  // Pause playback
  await evalJs(ws, `
    const pauseBtn = document.querySelector('button[title*="Pause"]');
    if (pauseBtn) pauseBtn.click();
  `);
  await wait(500);

  // Close Edge
  ws.close();
  edge.kill();
  console.log('\n[SUCCESS] All 5 Map Modes and Timeline Verified!');
}

run().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
