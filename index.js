const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;

/* ================= HTTP SERVER ================= */
const server = http.createServer((req, res) => {

// Health check
if (req.url === "/health") {
res.writeHead(200, { "Content-Type": "text/plain" });
res.end("OK");
return;
}

// Root page
if (req.url === "/") {
res.writeHead(200, { "Content-Type": "text/plain" });
res.end("WS Click Server Running");
return;
}

// fallback
res.writeHead(404, { "Content-Type": "text/plain" });
res.end("Not Found");
});

/* ================= WS SERVER ================= */
const wss = new WebSocket.Server({
server,
clientTracking: true,
perMessageDeflate: false
});

console.log("🔥 WS Server starting...");

wss.on("connection", (ws, req) => {

const ip = req.socket.remoteAddress;
console.log("📱 Client connected:", ip);

ws.isAlive = true;

ws.on("pong", () => {
ws.isAlive = true;
});

ws.on("message", (data) => {

```
const msg = data.toString().trim();
if (!msg) return;

console.log("📨 Receive:", msg);

let count = 0;

wss.clients.forEach((client) => {

  if (client !== ws && client.readyState === WebSocket.OPEN) {
    client.send(msg);
    count++;
  }

});

console.log("📤 Broadcast to", count, "clients");
```

});

ws.on("close", () => {
console.log("❌ Client disconnected:", ip);
});

ws.on("error", (err) => {
console.log("⚠ WS error:", err.message);
});

});

/* ================= KEEP ALIVE ================= */
const interval = setInterval(() => {

wss.clients.forEach((ws) => {

```
if (ws.isAlive === false) {
  console.log("💀 Terminate dead client");
  return ws.terminate();
}

ws.isAlive = false;
ws.ping();
```

});

}, 20000);

wss.on("close", () => {
clearInterval(interval);
});

/* ================= START ================= */
server.listen(PORT, () => {
console.log("🚀 Server running on port", PORT);
});
