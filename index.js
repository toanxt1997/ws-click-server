const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;

/* ================= HTTP SERVER ================= */

const server = http.createServer((req, res) => {

  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("WebSocket server is running");
    return;
  }

  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
    return;
  }

  res.writeHead(404);
  res.end();
});

/* ================= WEBSOCKET ================= */

const wss = new WebSocket.Server({ server });

const clients = new Set();

console.log("🔥 WS Server starting...");

wss.on("connection", (ws, req) => {

  console.log("Client connected", req.socket.remoteAddress);

  clients.add(ws);

  ws.on("message", (message) => {
    const msg = message.toString();
    console.log("Received:", msg);

    // broadcast cho tất cả client
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    clients.delete(ws);
  });

  ws.on("error", (err) => {
    console.log("WS error:", err);
  });
});

/* ================= KEEP ALIVE ================= */

setInterval(() => {
  clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send("ping");
    }
  });
}, 30000);

/* ================= START SERVER ================= */

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
