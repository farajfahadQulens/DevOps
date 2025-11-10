const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 3002 });

wss.on("connection", ws => {
  ws.on("message", msg => {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  });
});

console.log("WebSocket server running on port 3002");
