import WebSocket, { WebSocketServer } from "ws";

const PORT = process.env.PORT || 10000;

const wss = new WebSocketServer({
  port: PORT,
  clientTracking: true,
  perMessageDeflate: false,
});

console.log("🔥 WS server running on port", PORT);

wss.on("connection", (ws) => {
  console.log("📱 Client connected");
  ws.isAlive = true;

  // BẮT BUỘC: nhận pong
  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (data) => {
    const msg = data.toString().trim();
    console.log("📨 Receive:", msg);

    // broadcast cho TẤT CẢ client
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

// 🔥 KEEP ALIVE (CỨU MẠNG)
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log("💀 Terminate dead client");
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping(); // 👈 ping định kỳ
  });
}, 20000);

wss.on("close", () => {
  clearInterval(interval);
});
