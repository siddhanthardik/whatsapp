const Message = require('../models/Message');
const Contact = require('../models/Contact');
const Campaign = require('../models/Campaign');

const OPT_OUT_KEYWORDS = [
  'STOP',
  'UNSUBSCRIBE',
  'CANCEL',
  'END',
  'QUIT'
];

function sendOk(res) {
  return res.status(200).send('OK');
}

/**
 * =========================================
 * VERIFY WHATSAPP WEBHOOK
 * =========================================
 */

exports.verify = async (req, res) => {
  try {

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const VERIFY_TOKEN =
      process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ||
      'skillwithmedily_webhook_verify';

    console.log('==============================');
    console.log('WHATSAPP WEBHOOK VERIFY');
    console.log('MODE:', mode);
    console.log('TOKEN:', token);
    console.log('CHALLENGE:', challenge);
    console.log('==============================');

    if (
      mode === 'subscribe' &&
      token === VERIFY_TOKEN
    ) {

      console.log('Webhook verified successfully');

      return res
        .status(200)
        .send(challenge);

    }

    console.log('Webhook verification failed');

    return res
      .status(403)
      .send('Forbidden');

  } catch (error) {

    console.error(
      'Webhook verification error:',
      error
    );

    return res
      .status(500)
      .send('Webhook verification failed');

  }
};

/**
 * =========================================
 * RECEIVE WHATSAPP EVENTS
 * =========================================
 */

exports.receive = (req, res) => {

  try {

    sendOk(res);

  } catch (e) {

    console.error(
      'Webhook response error:',
      e
    );

  }

  (async () => {

    try {

      const body = req.body;

      if (!body || !body.entry) {
        return;
      }

      for (const entry of body.entry) {

        if (!entry.changes) {
          continue;
        }

        for (const change of entry.changes) {

          const val = change.value || {};

          /**
           * =========================================
           * STATUS UPDATES
           * =========================================
           */

          if (Array.isArray(val.statuses)) {

            for (const statusObj of val.statuses) {

              const waId =
                statusObj.id ||
                statusObj.message_id ||
                statusObj.messageId;

              if (!waId) {
                continue;
              }

              const msg = await Message.findOne({
                wamid: waId,
              });

              const statusMap = {
                sent: 'sent',
                delivered: 'delivered',
                read: 'read',
                failed: 'failed',
              };

              const mappedStatus =
                statusMap[statusObj.status];

              if (mappedStatus && msg) {
                // Prevent duplicate metric increments by checking if the status is already this or higher
                const statusOrder = { pending: 1, sent: 2, delivered: 3, read: 4, failed: 5 };
                const currentOrder = statusOrder[msg.status] || 0;
                const newOrder = statusOrder[mappedStatus] || 0;

                // Push raw payload
                if (!msg.webhookPayloads) msg.webhookPayloads = [];
                msg.webhookPayloads.push(statusObj);

                if (newOrder > currentOrder || mappedStatus === 'failed') {
                  msg.status = mappedStatus;
                  
                  if (mappedStatus === 'failed' && statusObj.errors && statusObj.errors.length > 0) {
                    msg.errorDetails = statusObj.errors[0].message || statusObj.errors[0].title;
                  }

                  await msg.save();

                  // Update Campaign Stats securely
                  if (msg.campaignId) {
                    const incObj = {};
                    if (mappedStatus === 'delivered') incObj['stats.delivered'] = 1;
                    if (mappedStatus === 'read') incObj['stats.read'] = 1;
                    if (mappedStatus === 'failed') incObj['stats.failed'] = 1;
                    // Note: 'sent' is usually incremented by the worker at dispatch, not here, to avoid double counting

                    if (Object.keys(incObj).length > 0) {
                      await Campaign.findByIdAndUpdate(msg.campaignId, { $inc: incObj }, { new: true });
                    }
                  }

                  console.log(`Message ${waId} -> ${mappedStatus} (Campaign metric updated)`);
                } else {
                  await msg.save(); // just save the webhook payload
                  console.log(`Message ${waId} webhook saved, status remained ${msg.status}`);
                }
              }

            }

          }

          /**
           * =========================================
           * INCOMING MESSAGES
           * =========================================
           */

          if (Array.isArray(val.messages)) {

            for (const message of val.messages) {

              const from = message.from;

              const text =
                message.text?.body || '';

              if (!from) {
                continue;
              }

              const upper =
                text.trim().toUpperCase();

              /**
               * =========================================
               * HANDLE OPT OUT
               * =========================================
               */

              if (
                OPT_OUT_KEYWORDS.includes(upper)
              ) {

                const contact =
                  await Contact.findOne({
                    phoneNumber: from,
                  });

                if (contact) {

                  contact.optInStatus =
                    'opted_out';

                  await contact.save();

                  console.log(
                    `Contact opted out: ${from}`
                  );

                }

              }

              console.log(
                'Incoming message:',
                from,
                text
              );

            }

          }

        }

      }

    } catch (err) {

      console.error(
        'Webhook processing error:',
        err
      );

    }

  })();

};