const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;

/* ================= HTTP SERVER ================= */
const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("OK");
    return;
  }

  res.writeHead(200);
  res.end("WS Click Server Running");
});

/* ================= WS SERVER ================= */
const wss = new WebSocket.Server({
  server,
  clientTracking: true,
  perMessageDeflate: false,
});

console.log("🔥 WS + HTTP server running on port", PORT);

wss.on("connection", (ws) => {
  console.log("📱 Client connected");
  ws.isAlive = true;

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (data) => {
    const msg = data.toString().trim();
    console.log("📨 Receive:", msg);

    // broadcast cho tất cả client
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(msg);
      }
    });
  });

  ws.on("close", () => {
    console.log("❌ Client disconnected");
  });

  ws.on("error", (err) => {
    console.error("WS error:", err);
  });
});

/* ================= KEEP ALIVE ================= */
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log("💀 Terminate dead client");
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping();
  });
}, 20000);

wss.on("close", () => {
  clearInterval(interval);
});

/* ================= START ================= */
server.listen(PORT, () => {
  console.log("🚀 Server listening on port", PORT);
});
