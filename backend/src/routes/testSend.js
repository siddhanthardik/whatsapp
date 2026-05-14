const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/send", async (req, res) => {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${process.env.WABA_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
            to: "917838033664",
            type: "template",
            template: {
            name: "test_message",
                language: { code: "en" }
            }
        
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );
    res.json({ ok: true, data: response.data });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.response?.data || err.message });
  }
});

module.exports = router;