#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');

const Template = require('../src/models/Template');
let User;
try { User = require('../src/models/User'); } catch (e) { User = null }

async function main() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/whatsapp';
  console.log('Connecting to', MONGO_URI);
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Try to find an existing organizationId from any user in the DB
  let orgId = null;
  try {
    if (User) {
      const u = await User.findOne({ organizationId: { $ne: null } }).lean();
      if (u && u.organizationId) {
        orgId = u.organizationId;
        console.log('Using organizationId from existing user:', String(orgId));
      }
    }
  } catch (e) {
    // ignore
  }

  // Fallback: allow specifying SEED_ORG_ID in env, otherwise generate a new ObjectId
  const { Types } = mongoose;
  if (!orgId) {
    if (process.env.SEED_ORG_ID) {
      orgId = Types.ObjectId(String(process.env.SEED_ORG_ID));
      console.log('Using SEED_ORG_ID from env:', String(orgId));
    } else {
      orgId = Types.ObjectId();
      console.log('No existing organizationId found — using generated id:', String(orgId));
      console.log('If you want these templates to belong to a real organization, set SEED_ORG_ID in backend/.env to an existing organizationId and re-run.');
    }
  }

  const samples = [
    {
      name: 'Diwali Offer 2026',
      category: 'MARKETING',
      language: 'en_US',
      header: { type: 'TEXT', text: 'Diwali Offer' },
      body: 'Hi {{1}}, enjoy {{2}}% off on our Diwali sale. Visit {{3}} to claim.',
      footer: 'T&Cs apply',
      buttons: [],
      approvalStatus: 'APPROVED',
      organizationId: orgId,
    },
    {
      name: 'Order Confirmation',
      category: 'UTILITY',
      language: 'en_US',
      header: null,
      body: 'Hello {{1}}, your order {{2}} has been confirmed. Track at {{3}}',
      footer: null,
      buttons: [],
      approvalStatus: 'APPROVED',
      organizationId: orgId,
    },
    {
      name: 'OTP Verification',
      category: 'AUTHENTICATION',
      language: 'en_US',
      header: null,
      body: 'Your OTP is {{1}}. It expires in 5 minutes.',
      footer: null,
      buttons: [],
      approvalStatus: 'APPROVED',
      organizationId: orgId,
    },
  ];

  for (const s of samples) {
    try {
      await Template.findOneAndUpdate(
        { name: s.name, organizationId: s.organizationId },
        { $set: s },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log('Seeded template:', s.name);
    } catch (err) {
      console.error('Failed to seed', s.name, err.message || err);
    }
  }

  await mongoose.disconnect();
  console.log('Seeding complete. Disconnected.');
  process.exit(0);
}

main().catch(err => {
  console.error('Seed script error:', err);
  process.exit(1);
});
