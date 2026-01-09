const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

console.log("WS server running on port", PORT);

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (msg) => {
    const text = msg.toString();
    console.log("Receive:", text);

    // broadcast cho tất cả client
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(text);
      }
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});
