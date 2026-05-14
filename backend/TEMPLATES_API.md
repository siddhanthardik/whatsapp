# WhatsApp Templates API Documentation

## Overview
Production-grade REST API for managing WhatsApp message templates. All endpoints are protected with JWT authentication and role-based access control.

## Authentication
All endpoints require:
- `Authorization: Bearer <JWT_TOKEN>` header
- User roles: `campaign_manager`, `org_admin`, or `super_admin`

## Base URL
```
http://localhost:5000/api/templates
```

---

## Endpoints

### 1. Create Template
**POST** `/api/templates`

Creates a new template in draft status.

#### Request Body
```json
{
  "name": "Welcome Message",
  "templateId": "welcome_message",
  "category": "UTILITY",
  "language": "en_US",
  "header": {
    "type": "TEXT",
    "text": "Welcome to our service"
  },
  "body": "Hi {{1}}, welcome! We're glad to have you.",
  "footer": "Thank you for choosing us",
  "buttons": [
    {
      "type": "QUICK_REPLY",
      "text": "Get Started"
    },
    {
      "type": "CALL_TO_ACTION",
      "text": "Learn More",
      "url": "https://example.com"
    }
  ]
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "template": {
      "_id": "65d7a8c1f9c0e1b2c3d4e5f6",
      "organizationId": "65d7a8c1f9c0e1b2c3d4e5f0",
      "createdBy": {
        "_id": "65d7a8c1f9c0e1b2c3d4e5f1",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "name": "Welcome Message",
      "templateId": "welcome_message",
      "category": "UTILITY",
      "language": "en_US",
      "status": "PENDING",
      "header": { "type": "TEXT", "text": "Welcome to our service" },
      "body": "Hi {{1}}, welcome! We're glad to have you.",
      "footer": "Thank you for choosing us",
      "buttons": [...],
      "variables": ["1"],
      "createdAt": "2024-03-25T10:30:00Z",
      "updatedAt": "2024-03-25T10:30:00Z"
    }
  },
  "message": "Template created"
}
```

---

### 2. List Templates
**GET** `/api/templates`

Lists all templates for the organization with pagination and filtering.

#### Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 25) |
| `search` | string | Search template by name |
| `status` | string | Filter by status: PENDING, APPROVED, REJECTED |
| `category` | string | Filter by category: UTILITY, MARKETING, AUTHENTICATION |

#### Example Request
```
GET /api/templates?page=1&limit=10&status=APPROVED&category=MARKETING
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "_id": "65d7a8c1f9c0e1b2c3d4e5f6",
        "name": "Welcome Message",
        "category": "UTILITY",
        "language": "en_US",
        "status": "APPROVED",
        "header": { "type": "TEXT", "text": "Welcome" },
        "body": "Hi {{1}}, welcome!",
        "footer": "Thank you",
        "buttons": [],
        "variables": ["1"]
      }
    ],
    "meta": {
      "total": 42,
      "page": 1,
      "limit": 10
    }
  },
  "message": "Templates retrieved"
}
```

---

### 3. Get Single Template
**GET** `/api/templates/:id`

Retrieves a single template by ID with full details.

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "template": {
      "_id": "65d7a8c1f9c0e1b2c3d4e5f6",
      "organizationId": "65d7a8c1f9c0e1b2c3d4e5f0",
      "createdBy": {
        "_id": "65d7a8c1f9c0e1b2c3d4e5f1",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "name": "Welcome Message",
      "templateId": "welcome_message",
      "category": "UTILITY",
      "language": "en_US",
      "status": "PENDING",
      "header": { "type": "TEXT", "text": "Welcome" },
      "body": "Hi {{1}}, welcome!",
      "footer": "Thank you",
      "buttons": [],
      "variables": ["1"],
      "whatsappTemplateId": null,
      "rejectionReason": null,
      "createdAt": "2024-03-25T10:30:00Z",
      "updatedAt": "2024-03-25T10:30:00Z"
    }
  },
  "message": "Template retrieved"
}
```

---

### 4. Update Template
**PUT** `/api/templates/:id`

Updates a template (only if in PENDING or REJECTED status).

#### Request Body
```json
{
  "name": "Updated Welcome Message",
  "body": "Hi {{1}}, welcome to our updated service!",
  "footer": "Best regards"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "template": { ... }
  },
  "message": "Template updated"
}
```

#### Error: Cannot Update Approved Template
```json
{
  "success": false,
  "data": {},
  "message": "Approved templates cannot be edited"
}
```

---

### 5. Delete Template
**DELETE** `/api/templates/:id`

Permanently deletes a template (only draft/rejected).

#### Response (200 OK)
```json
{
  "success": true,
  "data": {},
  "message": "Template deleted"
}
```

---

### 6. Submit Template for Approval
**POST** `/api/templates/:id/submit`

Submits template to WhatsApp Cloud API for review and approval.

#### Submission Process
1. Template status changes to `PENDING` (awaiting WhatsApp review)
2. WhatsApp sends webhook callbacks with approval status
3. `whatsappTemplateId` is populated with Meta's template ID
4. Status updates to `APPROVED` or `REJECTED` based on Meta's response

#### Request Body
```json
{}
```

#### Response (200 OK - Submission Successful)
```json
{
  "success": true,
  "data": {
    "response": {
      "id": "waba_template_123456",
      "message": "Template submitted for approval"
    }
  },
  "message": "Template submitted to WhatsApp - waiting for approval"
}
```

#### Error Responses

**Template Already Approved**
```json
{
  "success": false,
  "data": {},
  "message": "Template already approved"
}
```

**Missing Configuration**
```json
{
  "success": false,
  "data": {},
  "message": "WABA configuration missing (WABA_BUSINESS_ACCOUNT_ID or WHATSAPP_API_TOKEN)"
}
```

**API Error from Meta**
```json
{
  "success": false,
  "data": {},
  "message": "Submission failed: Invalid template format"
}
```

---

## Template Status Lifecycle

```
DRAFT/PENDING → Submit → PENDING (awaiting WhatsApp review)
                              ↓
                        APPROVED ✅
                              OR
                        REJECTED ❌ → Edit & Resubmit
```

**Status Values:**
- `PENDING` - Awaiting approval from WhatsApp
- `APPROVED` - Approved and ready to send
- `REJECTED` - Rejected by WhatsApp (check `rejectionReason`)

---

## Template Variables

Variables in template body are automatically extracted and stored:

```
Body: "Hello {{1}}, your order {{2}} has arrived."
Variables: ["1", "2"]
```

When sending messages, provide values for each variable:
```json
{
  "template": {
    "name": "order_arrival",
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "John" },
          { "type": "text", "text": "ORD-12345" }
        ]
      }
    ]
  }
}
```

---

## Header Types

| Type | Description | Fields |
|------|-------------|--------|
| `TEXT` | Text header | `text` (required) |
| `IMAGE` | Image header | `mediaUrl` (required) |
| `DOCUMENT` | Document/PDF | `mediaUrl` (required) |

---

## Button Types

| Type | Fields | Use Case |
|------|--------|----------|
| `QUICK_REPLY` | `text` | User selects predefined option |
| `CALL_TO_ACTION` | `text`, `url` | Click to visit website/URL |

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad request - missing/invalid fields |
| 401 | Unauthorized - no token or invalid token |
| 403 | Forbidden - user cannot access this template |
| 404 | Not found - template doesn't exist |
| 409 | Conflict - template name already exists in org |
| 500 | Server error |
| 502 | Bad gateway - Meta API error |

---

## Environment Variables Required

```bash
# WhatsApp Business Account
WABA_BUSINESS_ACCOUNT_ID=722042534333781
WABA_PHONE_NUMBER_ID=631439486730277
WHATSAPP_API_TOKEN=EAAXXX...

# Webhook
WABA_WEBHOOK_VERIFY_TOKEN=your_secure_token

# MongoDB
MONGO_URI=mongodb+srv://...

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

---

## Example: Complete Template Creation & Submission Flow

### Step 1: Create Template
```bash
curl -X POST http://localhost:5000/api/templates \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Order Confirmation",
    "templateId": "order_confirmation",
    "category": "UTILITY",
    "body": "Order {{1}} confirmed for {{2}}",
    "buttons": [
      { "type": "QUICK_REPLY", "text": "Track Order" }
    ]
  }'
```

### Step 2: Submit for Approval
```bash
curl -X POST http://localhost:5000/api/templates/TEMPLATE_ID/submit \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 3: Check Status
```bash
curl -X GET http://localhost:5000/api/templates/TEMPLATE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Best Practices

1. **Use descriptive template IDs** - lowercase, underscores, concise
2. **Test templates** - always preview before submitting to WhatsApp
3. **Variable count** - limit to 10-15 variables per template
4. **Button limits** - max 3 buttons per template
5. **Localization** - create separate templates for each language
6. **Content policy** - follow WhatsApp's template guidelines
7. **Updates** - approved templates can't be edited; create new versions instead

---

## Testing

Use these test credentials to verify the API:

```bash
# Get auth token first
POST /api/auth/login
{
  "email": "siddhanthardik@gmail.com",
  "password": "Siddhant@2026"
}
```

Then use the returned token for template API calls.

---

## Support

For issues or questions:
1. Check WhatsApp Business API documentation
2. Review Meta's template requirements
3. Check server logs: `npm run dev`
4. Verify WABA credentials in `.env`
