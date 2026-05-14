# Production-Grade WhatsApp Templates API - Setup Guide

## 📋 What Was Created

A complete, production-ready REST API for managing WhatsApp message templates with:

```
✅ Full CRUD operations for templates
✅ Draft → Pending → Approved workflow
✅ Integration with Meta's WhatsApp Cloud API
✅ Role-based access control
✅ Pagination and filtering
✅ Automatic variable extraction
✅ Error handling and validation
✅ Comprehensive logging
```

---

## 🏗️ Architecture Overview

### Files Modified/Created:
1. **[Template Model](./src/models/Template.js)** - MongoDB schema with all template fields
2. **[Template Controller](./src/controllers/templateController.js)** - Business logic for all operations
3. **[Template Routes](./src/routes/templates.js)** - REST API endpoints
4. **[.env](../.env)** - Added WABA_BUSINESS_ACCOUNT_ID

### API Endpoints:
```
POST   /api/templates              → Create new template
GET    /api/templates              → List templates (paginated)
GET    /api/templates/:id          → Get single template
PUT    /api/templates/:id          → Update template
DELETE /api/templates/:id          → Delete template
POST   /api/templates/:id/submit   → Submit to WhatsApp for approval
```

---

## 🚀 Quick Start

### 1. Verify Environment Variables
Check your `.env` file has these values:

```bash
# Meta / WhatsApp Business API
WHATSAPP_API_TOKEN=YOUR_API_TOKEN_HERE
WABA_PHONE_NUMBER_ID=631439486730277
WABA_BUSINESS_ACCOUNT_ID=722042534333781
WABA_WEBHOOK_VERIFY_TOKEN=MySecureToken@2026!
```

### 2. Start Backend Server
```bash
cd backend
npm install   # if needed
npm run dev
```

You should see:
```
Server listening on port 5000
MongoDB connected
Template routes initialized
```

### 3. Test the API
```bash
# Get authentication token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "siddhanthardik@gmail.com",
    "password": "Siddhant@2026"
  }'

# Copy the token from response
# Use it in subsequent requests:
export TOKEN="your_jwt_token_here"

# Create a template
curl -X POST http://localhost:5000/api/templates \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Welcome Message",
    "category": "UTILITY",
    "body": "Hello {{1}}, welcome to our service!",
    "buttons": [
      { "type": "QUICK_REPLY", "text": "Get Started" }
    ]
  }'
```

---

## 📊 Database Schema

### Template Document Structure:
```json
{
  "_id": "ObjectId",
  "organizationId": "ObjectId",
  "createdBy": "ObjectId (ref User)",
  "name": "Welcome Message",
  "templateId": "welcome_message",
  "category": "UTILITY",
  "language": "en_US",
  "header": {
    "type": "TEXT|IMAGE|DOCUMENT",
    "text": "Header text",
    "mediaUrl": "https://..."
  },
  "body": "Hello {{1}}, welcome!",
  "footer": "Thank you",
  "buttons": [
    {
      "type": "QUICK_REPLY|CALL_TO_ACTION",
      "text": "Button text",
      "url": "https://...",
      "phone": "+1234567890"
    }
  ],
  "variables": ["1"],
  "approvalStatus": "PENDING|APPROVED|REJECTED",
  "whatsappTemplateId": "waba_template_123",
  "rejectionReason": null,
  "createdAt": "2024-03-25T10:30:00Z",
  "updatedAt": "2024-03-25T10:30:00Z"
}
```

---

## 🔐 Security Features

1. **JWT Authentication**: All endpoints require valid JWT token
2. **Role-Based Access Control**: 
   - `campaign_manager`, `org_admin`, `super_admin` can create/update
   - `super_admin` can access any organization's templates
   - Other roles are org-scoped

3. **Input Validation**:
   - Template name required
   - Body text required
   - Category enum validation
   - Template ID format: lowercase, numbers, underscores only

4. **CORS Protection**: Configured via helmet middleware

---

## 🔄 Template Submission Flow

### Step 1: Create Draft Template
```bash
POST /api/templates
Body: { name, body, ... }
Response: Template with status="PENDING"
```

### Step 2: Submit to WhatsApp
```bash
POST /api/templates/:id/submit

# Inside the controller:
1. Validates template ownership
2. Builds Meta-compliant components structure
3. Calls: POST https://graph.facebook.com/v19.0/{WABA_ID}/message_templates
4. Stores whatsappTemplateId from response
5. Updates approvalStatus to "PENDING"
```

### Step 3: Meta Review
WhatsApp reviews template within 24-48 hours and:
- **Approves** → Status: `APPROVED` ✅
- **Rejects** → Status: `REJECTED`, stores `rejectionReason`

### Step 4: Edit & Resubmit (if Rejected)
```bash
PUT /api/templates/:id
# Fix issues
POST /api/templates/:id/submit
```

---

## 🛠️ Example: Complete Template Lifecycle

### Create Marketing Template
```bash
curl -X POST http://localhost:5000/api/templates \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Black Friday Promo",
    "templateId": "black_friday_promo",
    "category": "MARKETING",
    "language": "en_US",
    "header": {
      "type": "IMAGE",
      "mediaUrl": "https://cdn.example.com/promo.jpg"
    },
    "body": "{{1}}! Get {{2}}% OFF on {{3}}. Limited time only!",
    "footer": "Offer valid until {{4}}",
    "buttons": [
      {
        "type": "CALL_TO_ACTION",
        "text": "Shop Now",
        "url": "https://shop.example.com/promo"
      },
      {
        "type": "QUICK_REPLY",
        "text": "Learn More"
      }
    ]
  }'
```

### Response:
```json
{
  "success": true,
  "data": {
    "template": {
      "_id": "65d7a8c1f...",
      "name": "Black Friday Promo",
      "templateId": "black_friday_promo",
      "status": "PENDING",
      "variables": ["1", "2", "3", "4"],
      "createdBy": { "name": "John Doe" },
      "createdAt": "2024-03-25T10:30:00Z"
    }
  },
  "message": "Template created"
}
```

### Submit for Approval:
```bash
curl -X POST http://localhost:5000/api/templates/65d7a8c1f.../submit \
  -H "Authorization: Bearer $TOKEN"
```

### Response:
```json
{
  "success": true,
  "data": {
    "response": {
      "id": "waba_template_987654",
      "message": "Template submitted for approval"
    }
  },
  "message": "Template submitted to WhatsApp - waiting for approval"
}
```

### Check Status:
```bash
curl -X GET http://localhost:5000/api/templates/65d7a8c1f... \
  -H "Authorization: Bearer $TOKEN"
```

Response shows:
- `status: "PENDING"` - Awaiting WhatsApp review
- `whatsappTemplateId: "waba_template_987654"` - Meta's ID
- `rejectionReason: null` - No issues

Once approved:
- `status: "APPROVED"`
- Can send messages using this template

---

## 📈 Filtering & Pagination Examples

### Get Approved Marketing Templates (Page 2)
```bash
GET /api/templates?status=APPROVED&category=MARKETING&page=2&limit=20
```

### Search Templates by Name
```bash
GET /api/templates?search=welcome
```

### Get All Pending Templates
```bash
GET /api/templates?status=PENDING
```

---

## ⚠️ Common Issues & Fixes

### Issue: "WABA configuration missing"
**Cause**: Missing environment variables  
**Fix**: 
```bash
# Verify in .env:
WABA_BUSINESS_ACCOUNT_ID=722042534333781
WHATSAPP_API_TOKEN=EAAXXX...
# Restart server: npm run dev
```

### Issue: "Template already approved"
**Cause**: Can't resubmit approved templates  
**Fix**: Create a new version of the template with different name

### Issue: "Approved templates cannot be edited"
**Cause**: Trying to update an approved template  
**Fix**: Create a new template instead

### Issue: 403 Forbidden
**Cause**: User from different organization trying to access  
**Fix**: Only org_admin or super_admin can create templates

---

## 🧪 Testing with Postman

Import these requests:

### 1. Login
```
POST http://localhost:5000/api/auth/login
{
  "email": "siddhanthardik@gmail.com",
  "password": "Siddhant@2026"
}
```
Copy `token` to Authorization Bearer field

### 2. Create Template
```
POST http://localhost:5000/api/templates
Authorization: Bearer {token}
{
  "name": "Test",
  "body": "Test message {{1}}"
}
```

### 3. List Templates
```
GET http://localhost:5000/api/templates
Authorization: Bearer {token}
```

### 4. Submit Template
```
POST http://localhost:5000/api/templates/{id}/submit
Authorization: Bearer {token}
```

---

## 📚 Reference Documentation

- [Complete API Documentation](./TEMPLATES_API.md)
- [Template Schema](./src/models/Template.js)
- [Controller Logic](./src/controllers/templateController.js)
- [Meta WhatsApp API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api/message-templates/manage-templates)

---

## 🚢 Deployment Checklist

- [ ] All environment variables set in production
- [ ] WHATSAPP_API_TOKEN is valid and not expired
- [ ] WABA_BUSINESS_ACCOUNT_ID verified with Meta
- [ ] MongoDB Atlas connection tested
- [ ] CORS origins configured for frontend domain
- [ ] Rate limiting adjusted for traffic
- [ ] Error logging configured (e.g., Sentry)
- [ ] Backup strategy for MongoDB in place
- [ ] SSL/TLS certificates enabled
- [ ] Webhook endpoint publicly accessible

---

## 💡 Next Steps

1. **Test API** with Postman or cURL
2. **Create sample templates** for your use case
3. **Submit to WhatsApp** for approval (24-48 hours)
4. **Integrate frontend** to create/manage templates via UI
5. **Set up webhook** to receive approval status updates
6. **Monitor logs** for any API errors

---

## 📞 Support

For Meta WhatsApp API support:
- Visit: https://developers.facebook.com/docs/whatsapp/
- Check: https://developers.facebook.com/support/

For this implementation:
- Check logs: `npm run dev`
- Verify `.env` configuration
- Review error messages in API responses
