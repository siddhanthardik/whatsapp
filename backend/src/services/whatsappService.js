const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

class WhatsAppService {
  constructor({ maxRetries = 3, baseDelayMs = 1000 } = {}) {
    this.maxRetries = maxRetries;
    this.baseDelayMs = baseDelayMs;
  }

  // Read env at call time — not at module load time
  get phoneNumberId() {
    return process.env.WABA_PHONE_NUMBER_ID;
  }

  get token() {
    return process.env.WHATSAPP_API_TOKEN;
  }

  get businessAccountId() {
    return process.env.WABA_BUSINESS_ACCOUNT_ID;
  }

  get baseURL() {
    return `https://graph.facebook.com/v19.0/${this.phoneNumberId}`;
  }

  getClient() {
    if (!this.phoneNumberId) console.warn('WhatsAppService: WABA_PHONE_NUMBER_ID not set');
    if (!this.token)         console.warn('WhatsAppService: WHATSAPP_API_TOKEN not set');

    return axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: { Authorization: `Bearer ${this.token}` }
    });
  }

  async _request(method, path, data, config = {}) {
    const client = this.getClient();
    let attempt = 0;

    while (true) {
      try {
        const res = await client.request(Object.assign({ method, url: path, data }, config));
        return res.data;
      } catch (err) {
        attempt += 1;
        const status = err?.response?.status;

        if (status === 429 && attempt <= this.maxRetries) {
          const retryAfter = err.response.headers?.['retry-after'];
          const waitMs = retryAfter
            ? Number(retryAfter) * 1000
            : this.baseDelayMs * Math.pow(2, attempt - 1);
          await new Promise((r) => setTimeout(r, waitMs));
          continue;
        }
        throw err;
      }
    }
  }

  // Generic send — used by messages route
  // payload: { to, type, text?, template?, ...}
  async sendMessage(payload) {
    return this._request('post', '/messages', {
      messaging_product: 'whatsapp',
      ...payload
    });
  }

  // Send simple text
  async sendTextMessage(to, body) {
    return this.sendMessage({ to, type: 'text', text: { body } });
  }

  // Send template
  async sendTemplateMessage(to, templateName, languageCode = 'en', components = []) {
    return this.sendMessage({
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components
      }
    });
  }

  // Send media (type: image | video | audio | document)
  async sendMediaMessage(to, type, mediaUrl, caption) {
    const mediaPayload = { link: mediaUrl };
    if (caption && ['image', 'video', 'document'].includes(type)) {
      mediaPayload.caption = caption;
    }
    return this.sendMessage({ to, type, [type]: mediaPayload });
  }

  // Get message delivery status
  async getMessageStatus(messageId) {
    return this._request('get', `/${messageId}`);
  }

  // Upload media file
  async uploadMedia(filePath, mimeType) {
    if (!fs.existsSync(filePath)) throw new Error('File not found: ' + filePath);
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    if (mimeType) form.append('type', mimeType);
    return this._request('post', '/media', form, {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${this.token}` }
    });
  }

  // Submit template to WhatsApp Cloud API
  // templatePayload: { name, language, category, components, etc. }
  async submitTemplate(templatePayload) {
    if (!this.businessAccountId) throw new Error('WABA_BUSINESS_ACCOUNT_ID not set');
    if (!this.token) throw new Error('WHATSAPP_API_TOKEN not set');
    
    const client = axios.create({
      baseURL: `https://graph.facebook.com/v19.0/${this.businessAccountId}`,
      timeout: 15000,
      headers: { Authorization: `Bearer ${this.token}` }
    });

    let attempt = 0;

    while (true) {
      try {
        const res = await client.request({
          method: 'post',
          url: '/message_templates',
          data: templatePayload
        });
        return res.data;
      } catch (err) {
        attempt += 1;
        const status = err?.response?.status;

        if (status === 429 && attempt <= this.maxRetries) {
          const retryAfter = err.response.headers?.['retry-after'];
          const waitMs = retryAfter
            ? Number(retryAfter) * 1000
            : this.baseDelayMs * Math.pow(2, attempt - 1);
          console.log(`Rate limited. Retrying in ${waitMs}ms (attempt ${attempt}/${this.maxRetries})`);
          await new Promise((r) => setTimeout(r, waitMs));
          continue;
        }
        throw err;
      }
    }
  }
}

module.exports = new WhatsAppService();