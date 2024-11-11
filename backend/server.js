const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  const { message, replyType } = req.body;

  try {
    const fetch = (await import("node-fetch")).default;  // Dynamic import for node-fetch
    const apiKey = process.env.OPENAI_API_KEY;
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: message },
        ],
        max_tokens: 150,
        temperature: 0.8,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      res.json(data.choices[0].message.content.trim());
    } else {
      const errorData = await response.json();
      res.status(500).json({ error: errorData });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
