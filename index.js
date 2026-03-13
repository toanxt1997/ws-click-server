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

  const ip = req.socket.remoteAddress;
  console.log("Client connected:", ip);

  clients.add(ws);

  ws.on("message", (message) => {

    const msg = message.toString();
    console.log("Received:", msg);

    // broadcast message
    clients.forEach(client => {

      if (!client || typeof client.send !== "function") {
        clients.delete(client);
        return;
      }

      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(msg);
        } catch {
          clients.delete(client);
        }
      }

    });

  });

  ws.on("close", () => {
    console.log("Client disconnected:", ip);
    clients.delete(ws);
  });

  ws.on("error", (err) => {
    console.log("WS error:", err);
    clients.delete(ws);
  });

});

/* ================= KEEP ALIVE ================= */

setInterval(() => {

  clients.forEach(ws => {

    if (!ws || typeof ws.send !== "function") {
      clients.delete(ws);
      return;
    }

    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send("ping");
      } catch {
        clients.delete(ws);
      }
    } else {
      clients.delete(ws);
    }

  });

}, 30000);

/* ================= START SERVER ================= */

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
