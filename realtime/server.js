import http from "http";
import { WebSocketServer } from "ws";

const PORT = process.env.PORT || 3002; // Render يعطي PORT تلقائياً

// HTTP server (لـ healthcheck وللزوم الـ proxy)
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("ok");
});

// WebSocket on top of the same HTTP server
const wss = new WebSocketServer({ server });

// optional: heartbeat حتى ما يقطع الـ proxy الاتصالات الطويلة
function heartbeat() { this.isAlive = true; }
setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  }
}, 30000);

wss.on("connection", (ws, req) => {
  console.log("WS connection", req.socket.remoteAddress);
  ws.isAlive = true;
  ws.on("pong", heartbeat);

  ws.on("message", (buf) => {
    let payload;
    try { payload = JSON.parse(buf.toString()); }
    catch { payload = { type: "raw", data: buf.toString() }; }

    // 🔥 بثّ الرسالة لجميع العملاء
    for (const client of wss.clients) {
      if (client.readyState === ws.OPEN) {
        client.send(JSON.stringify(payload));
      }
    }
  });

  ws.on("close", () => console.log("WS closed"));
  ws.send(JSON.stringify({ type: "welcome", at: Date.now() }));
});

server.listen(PORT, () => {
  console.log("HTTP/WS server listening on", PORT);
});
