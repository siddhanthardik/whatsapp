const axios = require('axios');
const Template = require('../models/Template');

const syncWhatsAppTemplates = async () => {
  try {

    const response = await axios.get(
      `https://graph.facebook.com/v25.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`,
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}`
        }
      }
    );

    const templates = response.data.data || [];

    for (const metaTemplate of templates) {

      const localTemplate = await Template.findOne({
        templateId: metaTemplate.name
      });

      if (!localTemplate) continue;

      let approvalStatus = 'pending';

      if (metaTemplate.status === 'APPROVED') {
        approvalStatus = 'approved';
      }

      if (metaTemplate.status === 'REJECTED') {
        approvalStatus = 'rejected';
      }

      localTemplate.approvalStatus = approvalStatus;
      localTemplate.metaTemplateStatus = metaTemplate.status;
      localTemplate.category = metaTemplate.category;
      localTemplate.language = metaTemplate.language;

      await localTemplate.save();
    }

    console.log(`Template sync completed. Synced ${templates.length} templates.`);

  } catch (error) {
    console.error(
      'Template sync failed:',
      error.response?.data || error.message
    );
  }
};

module.exports = syncWhatsAppTemplates;
