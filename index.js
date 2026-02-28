const http = require("http");
const WebSocket = require("ws");
const https = require("https");

const PORT = process.env.PORT || 10000;

/* ================= TELEGRAM CONFIG ================= */
const BOT_TOKEN = "8630430649:AAESV48PgMHa5DRIMGQylXdFq9YEPYI0ED4";
const CHAT_ID = "6244765083";

function sendTelegram(text) {
  const data = JSON.stringify({
    chat_id: CHAT_ID,
    text: text
  });

  const options = {
    hostname: "api.telegram.org",
    path: `/bot${BOT_TOKEN}/sendMessage`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(data)
    }
  };

  const req = https.request(options, (res) => {
    let body = "";
    res.on("data", chunk => body += chunk);
    res.on("end", () => {
      console.log("📨 Telegram response:", body);
    });
  });

  req.on("error", (err) => {
    console.log("❌ Telegram error:", err.message);
  });

  req.write(data);
  req.end();
};

  const req = https.request(options);
  req.write(data);
  req.end();
}

/* ================= WATCHDOG ================= */
let lastClickTime = Date.now();
let alertSent = false;
const ALERT_TIMEOUT = 120000; // 120 giây

setInterval(() => {
  const now = Date.now();

  if (now - lastClickTime > ALERT_TIMEOUT) {
    if (!alertSent) {
      console.log("⚠ 120s không có CLICK");
      sendTelegram("⚠ Server 120s không nhận CLICK_1 hoặc CLICK_2");
      alertSent = true;
    }
  }

}, 5000);


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


  /* ===== RECEIVE MESSAGE ===== */
  ws.on("message", (data) => {

    const msg = data.toString().trim();
    if (!msg) return;

    console.log("📨 Receive:", msg);

    // 👉 Reset watchdog nếu là CLICK
    if (msg === "CLICK_1" || msg === "CLICK_2") {
      lastClickTime = Date.now();
      alertSent = false;
    }

    let count = 0;

    wss.clients.forEach((client) => {

      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(msg);
        count++;
      }

    });

    console.log("📤 Broadcast to", count, "clients");

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
  console.log("🚀 Server running on port", PORT);
});
