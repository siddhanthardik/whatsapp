const Message = require('../models/Message');
const Contact = require('../models/Contact');
const Campaign = require('../models/Campaign');

const OPT_OUT_KEYWORDS = ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'];

function sendOk(res) {
  return res.status(200).send('OK');
}


// =========================
// VERIFY WEBHOOK (IMPORTANT)
// =========================

exports.verify = (req, res) => {

  const VERIFY_TOKEN = "medily_verify_token";

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("MODE:", mode);
  console.log("TOKEN:", token);

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("VERIFIED OK");
    return res.status(200).send(challenge);
  }

  return res.status(403).send("Forbidden");

};


// =========================
// RECEIVE WEBHOOK
// =========================

exports.receive = (req, res) => {

  try {
    sendOk(res);
  } catch (e) {
    console.error("Webhook response error:", e);
  }

  (async () => {

    try {

      const body = req.body;

      if (!body || !body.entry) return;

      for (const entry of body.entry) {

        if (!entry.changes) continue;

        for (const change of entry.changes) {

          const val = change.value || {};

          // STATUS UPDATES

          if (Array.isArray(val.statuses)) {

            for (const statusObj of val.statuses) {

              const waId =
                statusObj.id ||
                statusObj.message_id ||
                statusObj.messageId;

              if (!waId) continue;

              const msg = await Message.findOne({
                wamid: waId,
              });

              const statusMap = {
                sent:      'sent',
                delivered: 'delivered',
                read:      'read',
                failed:    'failed'
              };

              const mappedStatus = statusMap[statusObj.status];
              if (mappedStatus && msg) {
                msg.status = mappedStatus;
                await msg.save();
                console.log(`Message ${waId} → ${mappedStatus}`);
              }

            }

          }

          // INCOMING MESSAGE

          if (Array.isArray(val.messages)) {

            for (const message of val.messages) {

              const from = message.from;
              const text =
                message.text?.body || "";

              if (!from) continue;

              const upper = text.trim().toUpperCase();

              if (OPT_OUT_KEYWORDS.includes(upper)) {

                const contact =
                  await Contact.findOne({
                    phoneNumber: from,
                  });

                if (contact) {
                  contact.optInStatus = "opted_out";
                  await contact.save();
                }

              }

              console.log("Incoming:", from, text);

            }

          }

        }

      }

    } catch (err) {

      console.error("Webhook error:", err);

    }

  })();

};