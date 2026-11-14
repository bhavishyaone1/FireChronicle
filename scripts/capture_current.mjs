import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9229;
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
    '--window-size=1440,900',
    '--enable-webgl',
    'http://localhost:3000',
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
      console.log(`[BROWSER LOG] [${msg.params.type}] ${text}`);
    }
  });

  await sendCdp(ws, 'Runtime.enable');
  await sendCdp(ws, 'Page.enable');
  await sendCdp(ws, 'DOM.enable');

  console.log('Navigating to http://localhost:3000 ...');
  await sendCdp(ws, 'Page.navigate', { url: 'http://localhost:3000' });
  
  // Wait for React hydration and network data fetch
  console.log('Waiting for page to finish data loading...');
  for (let s = 0; s < 25; s++) {
    await wait(1000);
    const hasPulse = await sendCdp(ws, 'Runtime.evaluate', {
      expression: 'document.querySelectorAll(".animate-pulse").length',
      returnByValue: true,
    });
    const mapCanvas = await sendCdp(ws, 'Runtime.evaluate', {
      expression: 'document.querySelectorAll(".maplibregl-canvas").length',
      returnByValue: true,
    });
    console.log(`Sec ${s+1}: animate-pulse count=${hasPulse?.result?.value}, map-canvas count=${mapCanvas?.result?.value}`);
    if (hasPulse?.result?.value <= 1 && mapCanvas?.result?.value > 0 && s >= 4) {
      console.log('Data loaded and map canvas ready!');
      await wait(1500); // Wait for tile draw
      break;
    }
  }

  await captureScreenshot(ws, 'firechronicle_1440_perfect.png');
  await captureScreenshot(ws, 'current_live_1440.png');

  // Also capture scrolled view
  await sendCdp(ws, 'Runtime.evaluate', {
    expression: 'document.querySelector(".overflow-y-auto").scrollTop = 280',
  });
  await wait(800);
  await captureScreenshot(ws, 'current_live_scrolled_bottom.png');

  ws.close();
  edge.kill();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
