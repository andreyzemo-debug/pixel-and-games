const https = require("https");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket?.remoteAddress ||
      "";

    https.get(`http://ip-api.com/json/${ip}`, (response) => {
      let data = "";

      response.on("data", (chunk) => {
        data += chunk;
      });

      response.on("end", () => {
        const info = JSON.parse(data);

        const message = JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: `👀 New Visitor

🌍 Country: ${info.country || "Unknown"}
🏙️ City: ${info.city || "Unknown"}

🌐 IP: ${ip}

💻 Browser: ${req.body.browser}
🖥 Platform: ${req.body.platform}`,
        });

        const options = {
          hostname: "api.telegram.org",
          path: `/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(message),
          },
        };

        const telegram = https.request(options, () => {
          res.status(200).json({ ok: true });
        });

        telegram.write(message);
        telegram.end();
      });
    });
  } catch (e) {
    res.status(500).json({ ok: false });
  }
};
