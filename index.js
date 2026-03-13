const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {

  if (req.url === "/health") {
    res.writeHead(200);
    res.end("OK");
    return;
  }

  res.writeHead(200);
  res.end("WS server running");
});

const wss = new WebSocket.Server({ server });

let androidClients = new Set();
let pcClients = new Set();

console.log("🔥 WS Server starting...");

wss.on("connection", (ws, req) => {

  const ip = req.socket.remoteAddress;
  console.log("Client connected:", ip);

  ws.isAlive = true;

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (message) => {

    const msg = message.toString();

    if (msg === "ANDROID") {
      androidClients.add(ws);
      console.log("📱 Android registered");
      return;
    }

    if (msg === "PC") {
      pcClients.add(ws);
      console.log("💻 PC registered");
      return;
    }

    if (msg === "CLICK_1" || msg === "CLICK_2") {

      console.log("Received:", msg);

      androidClients.forEach(client => {

        if (client.readyState === WebSocket.OPEN) {
          try {
            client.send(msg);
          } catch {}
        }

      });

    }

  });

  ws.on("close", () => {
    console.log("Client disconnected:", ip);
    androidClients.delete(ws);
    pcClients.delete(ws);
  });

  ws.on("error", () => {
    androidClients.delete(ws);
    pcClients.delete(ws);
  });

});

/* KEEP CONNECTION ALIVE */

setInterval(() => {

  wss.clients.forEach(ws => {

    if (!ws.isAlive) {
      ws.terminate();
      return;
    }

    ws.isAlive = false;
    ws.ping();

  });

}, 25000);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
