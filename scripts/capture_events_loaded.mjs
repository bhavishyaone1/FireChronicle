import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9249;
const SCREENSHOT_DIR = 'C:\\Users\\bhavishya\\.gemini\\antigravity\\brain\\53073b53-3816-43e9-9032-999fd9626f0e\\screenshots';

async function run() {
  console.log('Launching browser...');
  const edge = spawn(EDGE_PATH, [
    '--headless=new',
    '--remote-debugging-port=' + PORT,
    '--window-size=1520,1020',
    'http://localhost:3000/#events',
  ]);
  await new Promise((r) => setTimeout(r, 2000));
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

  console.log('Waiting for events to load...');
  let loaded = false;
  for (let i = 0; i < 25; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const res = await send('Runtime.evaluate', {
      expression: 'document.body.innerText.includes("EVENT-IND")',
      returnByValue: true,
    });
    if (res.result?.value) {
      console.log('Events loaded at attempt ' + i);
      loaded = true;
      break;
    }
  }

  await new Promise((r) => setTimeout(r, 1000));
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(SCREENSHOT_DIR, 'candidate_events_loaded.png'), Buffer.from(shot.data, 'base64'));
  console.log('Saved candidate_events_loaded.png (loaded=' + loaded + ')');
  ws.close();
  edge.kill();
}

run().catch(console.error);
