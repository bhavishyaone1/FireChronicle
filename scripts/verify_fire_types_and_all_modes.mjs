import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9275;
const SCREENSHOT_DIR = 'C:\\Users\\bhavishya\\.gemini\\antigravity\\brain\\53073b53-3816-43e9-9032-999fd9626f0e\\screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function run() {
  console.log('Launching headless Edge for comprehensive Phase 0 verification...');
  const edge = spawn(EDGE_PATH, [
    '--headless=new',
    '--remote-debugging-port=' + PORT,
    '--window-size=1520,1020',
    'http://localhost:3000/#overview',
  ]);

  await new Promise((r) => setTimeout(r, 2500));
  const resp = await fetch('http://127.0.0.1:' + PORT + '/json');
  const targets = await resp.json();
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));

  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const id = Math.floor(Math.random() * 1000000);
      const handler = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id === id) {
          ws.removeEventListener('message', handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });

  await send('Runtime.enable');
  await send('Page.enable');

  console.log('Waiting for backend data load to complete...');
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const check = await send('Runtime.evaluate', {
      expression: `({
        isHarmonizing: document.body.innerText.includes("Harmonizing active fire"),
        hasNumbers: document.querySelectorAll('.tabular-nums').length > 0,
        text: document.body.innerText.slice(0, 300)
      })`,
      returnByValue: true,
    });
    const val = check.result?.value;
    if (val && !val.isHarmonizing && val.hasNumbers) {
      console.log('Data fully settled and rendered.');
      break;
    }
  }

  // Switch to Fire Types Mode
  console.log('Switching to Mode F: Fire Types (AI context & classification)...');
  await send('Runtime.evaluate', {
    expression: `
      const fireTypesBtn = document.querySelector('[data-view-btn="fire_types"]');
      if (fireTypesBtn) {
        fireTypesBtn.click();
      }
    `,
  });

  await new Promise((r) => setTimeout(r, 2000));

  // Capture screenshot of Fire Types Mode
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  const p1 = path.join(SCREENSHOT_DIR, 'dashboard_phase0_fire_types.png');
  fs.writeFileSync(p1, Buffer.from(shot1.data, 'base64'));
  console.log('Saved Fire Types Mode screenshot:', p1);

  // Click next arrow on ObservationDetailsPanel
  console.log('Stepping observation details...');
  await send('Runtime.evaluate', {
    expression: `
      const nextBtn = document.querySelector('button[title="Next observation"]');
      if (nextBtn) nextBtn.click();
    `,
  });

  await new Promise((r) => setTimeout(r, 1500));

  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  const p2 = path.join(SCREENSHOT_DIR, 'dashboard_phase0_observation_selected.png');
  fs.writeFileSync(p2, Buffer.from(shot2.data, 'base64'));
  console.log('Saved Observation Details screenshot:', p2);

  ws.close();
  edge.kill();
  console.log('Verification finished successfully!');
}

run().catch((err) => {
  console.error('Error running verification:', err);
  process.exit(1);
});
