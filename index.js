const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;

/* ================= HTTP SERVER ================= */

const server = http.createServer((req, res) => {

  if (req.url === "/health") {
    res.writeHead(200);
    res.end("OK");
    return;
  }

  res.writeHead(200);
  res.end("WS server running");
});

/* ================= WEBSOCKET ================= */

const wss = new WebSocket.Server({ server });

console.log("🔥 WS Server starting...");

wss.on("connection", (ws, req) => {

  const ip = req.socket.remoteAddress;
  console.log("Client connected:", ip);

  ws.isAlive = true;

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (msg) => {

    const text = msg.toString();

    if (text !== "ping") {
      console.log("Received:", text);
    }

    wss.clients.forEach(client => {

      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(text);
        } catch (err) {
          console.log("Send error:", err);
        }
      }

    });

  });

  ws.on("close", () => {
    console.log("Client disconnected:", ip);
  });

  ws.on("error", (err) => {
    console.log("WS error:", err);
  });

});

/* ================= KEEP CONNECTION ALIVE ================= */

setInterval(() => {

  wss.clients.forEach(ws => {

    if (!ws.isAlive) {
      console.log("⚠️ Killing dead client");
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping();

  });

}, 25000);

/* ================= START SERVER ================= */

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
