import { spawn } from 'child_process';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9265;

async function run() {
  const edge = spawn(EDGE_PATH, [
    '--headless=new',
    '--remote-debugging-port=' + PORT,
    'http://localhost:3000/#overview',
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

  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    if (msg.method === 'Console.messageAdded') {
      console.log('[BROWSER CONSOLE]', msg.params.message.level, msg.params.message.text);
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
    }
  });

  await send('Console.enable');
  await send('Runtime.enable');
  await send('Page.enable');

  await new Promise((r) => setTimeout(r, 5000));

  const evalRes = await send('Runtime.evaluate', {
    expression: `({
      hasMapContainer: !!document.querySelector('.fire-concentric-halo-marker, .maplibregl-canvas, [data-view-btn="points"], [data-view-btn="fire_types"]'),
      bodyText: document.body.innerText.slice(0, 500)
    })`,
    returnByValue: true
  });
  console.log('DOM check:', evalRes.result?.value);

  ws.close();
  edge.kill();
}

run().catch(console.error);
