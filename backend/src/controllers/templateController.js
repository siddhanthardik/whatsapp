const axios = require('axios');
const Template = require('../models/Template');

function sendResponse(res, success, data = {}, message = '', status = 200) {
  return res.status(status).json({ success, data, message });
}

/**
 * CREATE TEMPLATE
 * Accepts new structure with body: { text, variables }
 */
exports.createTemplate = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);

    const { name, templateId, category, language, header, body, footer, buttons } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return sendResponse(res, false, {}, 'Display name is required', 400);
    }

    if (!body || !body.text || !body.text.trim()) {
      return sendResponse(res, false, {}, 'Message body text is required', 400);
    }

    // Auto-generate templateId from name if not provided
    let finalTemplateId = templateId;
    if (!finalTemplateId) {
      finalTemplateId = name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
    } else {
      finalTemplateId = finalTemplateId.toLowerCase().trim();
    }

    // Create document
    const template = new Template({
      name: name.trim(),
      templateId: finalTemplateId,
      category: category || 'UTILITY',
      language: language || 'en_US',
      header: header || null,
      body: {
        text: body.text.trim(),
        variables: Array.isArray(body.variables) ? body.variables : [],
      },
      footer: footer ? { text: footer.text || footer } : null,
      buttons: Array.isArray(buttons) ? buttons.slice(0, 10) : [], // Max 10 buttons
      organizationId: user.organizationId,
      createdBy: user.id,
      approvalStatus: 'DRAFT', // Always start as DRAFT
    });

    await template.save();
    await template.populate('createdBy', 'name email');

    return sendResponse(res, true, { template }, 'Template created as draft', 201);
  } catch (err) {
    console.error('createTemplate error:', err.message);
    if (err.code === 11000) {
      return sendResponse(res, false, {}, 'Template name already exists in your organization', 409);
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return sendResponse(res, false, {}, `Validation error: ${messages.join(', ')}`, 400);
    }
    return sendResponse(res, false, {}, 'Failed to create template', 500);
  }
};

/**
 * GET TEMPLATES - List with pagination and filtering
 */
exports.getTemplates = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);

    const { page = 1, limit = 25, search, status, category } = req.query;
    const skip = (Math.max(Number(page), 1) - 1) * Math.max(Number(limit), 1);

    const query = {};
    if (user.role !== 'super_admin') {
      query.organizationId = user.organizationId;
    }
    if (status) query.approvalStatus = status;
    if (category) query.category = category;
    if (search) query.name = new RegExp(String(search).trim(), 'i');

    const [templates, total] = await Promise.all([
      Template.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Template.countDocuments(query),
    ]);

    const mapped = templates.map((t) => ({
      _id: t._id,
      name: t.name,
      templateId: t.templateId,
      category: t.category,
      language: t.language,
      status: t.approvalStatus,
      header: t.header,
      body: t.body,
      footer: t.footer,
      buttons: t.buttons || [],
      preview: t.body?.text ? t.body.text.substring(0, 100) : '',
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return sendResponse(
      res,
      true,
      { templates: mapped, meta: { total, page: Number(page), limit: Number(limit) } },
      'Templates retrieved'
    );
  } catch (err) {
    console.error('getTemplates error:', err);
    return sendResponse(res, false, {}, 'Failed to retrieve templates', 500);
  }
};

/**
 * GET SINGLE TEMPLATE BY ID
 */
exports.getTemplateById = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);

    const { id } = req.params;
    const template = await Template.findById(id).populate('createdBy', 'name email');

    if (!template) {
      return sendResponse(res, false, {}, 'Template not found', 404);
    }

    // Verify access
    if (String(template.organizationId) !== String(user.organizationId) && user.role !== 'super_admin') {
      return sendResponse(res, false, {}, 'Forbidden', 403);
    }

    const mapped = {
      _id: template._id,
      organizationId: template.organizationId,
      createdBy: template.createdBy,
      name: template.name,
      templateId: template.templateId,
      category: template.category,
      language: template.language,
      status: template.approvalStatus,
      header: template.header,
      body: template.body,
      footer: template.footer,
      buttons: template.buttons || [],
      whatsappTemplateId: template.whatsappTemplateId,
      rejectionReason: template.rejectionReason,
      submittedAt: template.submittedAt,
      approvedAt: template.approvedAt,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };

    return sendResponse(res, true, { template: mapped }, 'Template retrieved');
  } catch (err) {
    console.error('getTemplateById error:', err);
    return sendResponse(res, false, {}, 'Failed to retrieve template', 500);
  }
};

/**
 * UPDATE TEMPLATE
 * Only DRAFT and REJECTED templates can be edited
 */
exports.updateTemplate = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);

    const { id } = req.params;
    const template = await Template.findById(id);

    if (!template) {
      return sendResponse(res, false, {}, 'Template not found', 404);
    }

    // Verify access
    if (String(template.organizationId) !== String(user.organizationId) && user.role !== 'super_admin') {
      return sendResponse(res, false, {}, 'Forbidden', 403);
    }

    // Can only edit if DRAFT or REJECTED
    if (!['DRAFT', 'REJECTED'].includes(template.approvalStatus)) {
      return sendResponse(res, false, {}, `Cannot edit ${template.approvalStatus} templates`, 400);
    }

    // Update fields
    const updatableFields = ['name', 'templateId', 'category', 'language', 'header', 'body', 'footer', 'buttons'];
    updatableFields.forEach((field) => {
      if (typeof req.body[field] !== 'undefined') {
        if (field === 'body' && typeof req.body[field] === 'object') {
          template[field] = {
            text: req.body[field].text?.trim() || template.body.text,
            variables: Array.isArray(req.body[field].variables) ? req.body[field].variables : template.body.variables,
          };
        } else {
          template[field] = req.body[field];
        }
      }
    });

    // Validate required fields
    if (!template.name || !template.name.trim()) {
      return sendResponse(res, false, {}, 'Display name is required', 400);
    }
    if (!template.body || !template.body.text || !template.body.text.trim()) {
      return sendResponse(res, false, {}, 'Message body text is required', 400);
    }

    await template.save();
    return sendResponse(res, true, { template }, 'Template updated');
  } catch (err) {
    console.error('updateTemplate error:', err);
    if (err.code === 11000) {
      return sendResponse(res, false, {}, 'Template name already exists', 409);
    }
    return sendResponse(res, false, {}, 'Failed to update template', 500);
  }
};

/**
 * DELETE TEMPLATE
 */
exports.deleteTemplate = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);

    const { id } = req.params;
    const template = await Template.findById(id);

    if (!template) {
      return sendResponse(res, false, {}, 'Template not found', 404);
    }

    // Verify access
    if (String(template.organizationId) !== String(user.organizationId) && user.role !== 'super_admin') {
      return sendResponse(res, false, {}, 'Forbidden', 403);
    }

    // Can only delete if DRAFT or REJECTED
    if (!['DRAFT', 'REJECTED'].includes(template.approvalStatus)) {
      return sendResponse(res, false, {}, `Cannot delete ${template.approvalStatus} templates`, 400);
    }

    await Template.deleteOne({ _id: id });
    return sendResponse(res, true, {}, 'Template deleted');
  } catch (err) {
    console.error('deleteTemplate error:', err);
    return sendResponse(res, false, {}, 'Failed to delete template', 500);
  }
};

/**
 * SUBMIT TO WHATSAPP
 * Convert DRAFT → PENDING by submitting to Meta's Template API
 * Validates sample values before submission
 */
exports.submitToWhatsApp = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);

    const { id } = req.params;
    const template = await Template.findById(id);

    if (!template) {
      return sendResponse(res, false, {}, 'Template not found', 404);
    }

    // Verify access
    if (String(template.organizationId) !== String(user.organizationId) && user.role !== 'super_admin') {
      return sendResponse(res, false, {}, 'Forbidden', 403);
    }

    // Check status
    if (template.approvalStatus === 'APPROVED') {
      return sendResponse(res, false, {}, 'Template already approved', 400);
    }

    if (!['DRAFT', 'REJECTED'].includes(template.approvalStatus)) {
      return sendResponse(res, false, {}, 'Only DRAFT or REJECTED templates can be submitted', 400);
    }

    // Validate body text
    if (!template.body || !template.body.text || !template.body.text.trim()) {
      return sendResponse(res, false, {}, 'Template body is empty', 400);
    }

    // Check environment variables
    const wabaId = process.env.WABA_BUSINESS_ACCOUNT_ID;
    const token = process.env.WHATSAPP_API_TOKEN;
    if (!wabaId || !token) {
      return sendResponse(res, false, {}, 'WhatsApp configuration incomplete', 500);
    }

    // Build components for Meta API
    const components = [];

    // HEADER component
    if (template.header && template.header.type && template.header.type !== 'NONE') {
      const headerComponent = { type: 'HEADER' };

      if (template.header.type === 'TEXT') {
        headerComponent.format = 'TEXT';
        headerComponent.text = template.header.text;
      } else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(template.header.type)) {
        headerComponent.format = template.header.type;
        if (template.header.type === 'IMAGE' || template.header.type === 'VIDEO') {
          headerComponent.example = {
            header_handle_type: 'URL',
            header_url: [template.header.mediaUrl],
          };
        } else if (template.header.type === 'DOCUMENT') {
          headerComponent.example = {
            header_document_url: template.header.mediaUrl,
            header_filename: 'Document',
          };
        }
      }

      components.push(headerComponent);
    }

    // BODY component
    const bodyComponent = {
      type: 'BODY',
      text: template.body.text,
    };

    // Add example with sample values if variables exist
    if (template.body.variables && template.body.variables.length > 0) {
      bodyComponent.example = {
        body_text: [template.body.variables],
      };
    }

    components.push(bodyComponent);

    // FOOTER component
    if (template.footer && template.footer.text) {
      components.push({
        type: 'FOOTER',
        text: template.footer.text,
      });
    }

    // BUTTONS component
    if (template.buttons && template.buttons.length > 0) {
      const buttonComponent = { type: 'BUTTONS', buttons: [] };

      for (const btn of template.buttons) {
        if (btn.type === 'QUICK_REPLY') {
          buttonComponent.buttons.push({
            type: 'QUICK_REPLY',
            text: btn.text,
          });
        } else if (btn.type === 'URL') {
          buttonComponent.buttons.push({
            type: 'URL',
            text: btn.text,
            url: btn.url || '',
          });
        } else if (btn.type === 'PHONE_NUMBER') {
          buttonComponent.buttons.push({
            type: 'PHONE_NUMBER',
            text: btn.text,
            phone_number: btn.phoneNumber || '',
          });
        }
      }

      if (buttonComponent.buttons.length > 0) {
        components.push(buttonComponent);
      }
    }

    // Build final payload for Meta
    const metaPayload = {
      name: template.templateId || template.name.toLowerCase().replace(/\s+/g, '_'),
      language: template.language || 'en_US',
      category: template.category || 'UTILITY',
      components,
    };

    console.log('📤 Submitting to Meta:', {
      url: `https://graph.facebook.com/v19.0/${wabaId}/message_templates`,
      payload: metaPayload,
    });

    // Submit to Meta
    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${wabaId}/message_templates`,
      metaPayload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Success - update template status to PENDING and store WhatsApp ID
    if (response.data && (response.data.id || response.data.wamid)) {
      template.whatsappTemplateId = response.data.id || response.data.wamid;
      template.approvalStatus = 'PENDING';
      template.submittedAt = new Date();
      await template.save();

      console.log('✅ Template submitted successfully:', { id: response.data.id, wamid: response.data.wamid });

      return sendResponse(res, true, { template, metaResponse: response.data }, 'Template submitted to WhatsApp for approval');
    }

    return sendResponse(res, false, {}, 'No template ID returned from WhatsApp', 502);
  } catch (err) {
    console.error('submitToWhatsApp error:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });

    const metaErrorMsg = err.response?.data?.error?.message || err.response?.data?.message || err.message;
    return sendResponse(
      res,
      false,
      { error: err.response?.data },
      `Failed to submit template: ${metaErrorMsg}`,
      err.response?.status || 500
    );
  }
};

// Get templates - paginated and org-scoped (unless super_admin)
exports.getTemplates = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);
    // Query params: optional ?status=APPROVED to filter approvalStatus
    const { page = 1, limit = 25, search, approvalStatus, status, category } = req.query;
    const skip = (Math.max(Number(page), 1) - 1) * Math.max(Number(limit), 1);

    const query = {};
    if (user.role !== 'super_admin') query.organizationId = user.organizationId;
    // support both ?approvalStatus=... and ?status=... (status preferred)
    if (status) query.approvalStatus = status;
    else if (approvalStatus) query.approvalStatus = approvalStatus;
    if (category) query.category = category;
    if (search) query.name = new RegExp(String(search).trim(), 'i');

    // Always sort by createdAt descending as requested
    const sort = { createdAt: -1 };

    const [templates, total] = await Promise.all([
      Template.find(query).sort(sort).skip(skip).limit(Number(limit)),
      Template.countDocuments(query),
    ]);

    // Map templates to requested shape: _id, name, category, language, status, header, body, footer, buttons, variables
    const mapped = templates.map((t) => ({
      _id: t._id,
      name: t.name,
      category: t.category,
      language: t.language,
      status: t.approvalStatus,
      header: t.header,
      body: t.body,
      footer: t.footer,
      buttons: t.buttons || [],
      variables: t.variables || [],
    }));

    return sendResponse(res, true, { templates: mapped, meta: { total, page: Number(page), limit: Number(limit) } }, 'Templates retrieved');
  } catch (err) {
    console.error('getTemplates error:', err);
    return sendResponse(res, false, {}, 'Failed to retrieve templates', 500);
  }
};

// Get single template by ID
exports.getTemplateById = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);

    const { id } = req.params;
    const template = await Template.findById(id).populate('createdBy', 'name email');
    if (!template) return sendResponse(res, false, {}, 'Template not found', 404);

    // Verify access
    if (String(template.organizationId) !== String(user.organizationId) && user.role !== 'super_admin') {
      return sendResponse(res, false, {}, 'Forbidden', 403);
    }

    const mapped = {
      _id: template._id,
      organizationId: template.organizationId,
      createdBy: template.createdBy,
      name: template.name,
      templateId: template.templateId,
      category: template.category,
      language: template.language,
      status: template.approvalStatus,
      header: template.header,
      body: template.body,
      footer: template.footer,
      buttons: template.buttons || [],
      variables: template.variables || [],
      whatsappTemplateId: template.whatsappTemplateId,
      rejectionReason: template.rejectionReason,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };

    return sendResponse(res, true, { template: mapped }, 'Template retrieved');
  } catch (err) {
    console.error('getTemplateById error:', err);
    return sendResponse(res, false, {}, 'Failed to retrieve template', 500);
  }
};

// Update template - only if owned by org (or super_admin) and not yet approved
exports.updateTemplate = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);

    const { id } = req.params;
    const template = await Template.findById(id);
    if (!template) return sendResponse(res, false, {}, 'Template not found', 404);

    if (String(template.organizationId) !== String(user.organizationId) && user.role !== 'super_admin') {
      return sendResponse(res, false, {}, 'Forbidden', 403);
    }

    if (template.approvalStatus === 'APPROVED') return sendResponse(res, false, {}, 'Approved templates cannot be edited', 400);

    const updatable = ['name', 'category', 'language', 'header', 'body', 'footer', 'buttons'];
    updatable.forEach((k) => {
      if (typeof req.body[k] !== 'undefined') template[k] = req.body[k];
    });

    await template.save();
    return sendResponse(res, true, { template }, 'Template updated');
  } catch (err) {
    console.error('updateTemplate error:', err);
    if (err.code === 11000) return sendResponse(res, false, {}, 'Template name already exists in organization', 409);
    return sendResponse(res, false, {}, 'Failed to update template', 500);
  }
};

// Delete template
exports.deleteTemplate = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return sendResponse(res, false, {}, 'Authentication required', 401);

    const { id } = req.params;
    const template = await Template.findById(id);
    if (!template) return sendResponse(res, false, {}, 'Template not found', 404);

    if (String(template.organizationId) !== String(user.organizationId) && user.role !== 'super_admin') {
      return sendResponse(res, false, {}, 'Forbidden', 403);
    }

    await Template.findByIdAndDelete(id);
    return sendResponse(res, true, {}, 'Template deleted');
  } catch (err) {
    console.error('deleteTemplate error:', err);
    return sendResponse(res, false, {}, 'Failed to delete template', 500);
  }
};
